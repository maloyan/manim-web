// MCP server wiring: exposes the grounded manim-web API model as tools.

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import {
  ApiIndex,
  describeSymbol,
  listSymbols,
  loadModel,
  search,
  type ApiModel,
  type SymbolKind,
} from './model.js';

const KINDS: SymbolKind[] = ['class', 'interface', 'function', 'typeAlias', 'variable', 'enum'];

export function createServer(model: ApiModel): Server {
  const index = new ApiIndex(model);
  const categories = index.categories().map((c) => c.category);

  const tools: Tool[] = [
    {
      name: 'list_symbols',
      description:
        'List manim-web exported symbols (mobjects, animations, helpers, types). ' +
        'Optionally filter by category (derived from the source module path) or kind. ' +
        `Categories: ${categories.join(', ')}.`,
      inputSchema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: `Filter by category, e.g. ${categories.slice(0, 6).join(', ')}.`,
          },
          kind: {
            type: 'string',
            enum: KINDS,
            description: 'Filter by symbol kind.',
          },
        },
        additionalProperties: false,
      },
    },
    {
      name: 'describe_symbol',
      description:
        'Return the REAL signature of a manim-web symbol: a class constructor with its ' +
        'options-interface fields (name, type, default, JSDoc), a function signature with ' +
        'params and return type, or an interface/type/enum/variable definition, plus the ' +
        'summary and @example blocks. Use this to get grounded, non-hallucinated API details.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Exact symbol name, e.g. "Protein".' },
        },
        required: ['name'],
        additionalProperties: false,
      },
    },
    {
      name: 'search',
      description:
        'Keyword search across manim-web symbol names, summaries and option-field names. ' +
        'Returns ranked matches. Use it to find the right symbol before describe_symbol.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Keywords, e.g. "binding" or "bar chart".' },
        },
        required: ['query'],
        additionalProperties: false,
      },
    },
    {
      name: 'list_examples',
      description:
        'List manim-web symbols that ship a code @example block (name + summary). ' +
        'Pair with get_example to read the code.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
      name: 'get_example',
      description: 'Return the @example code block(s) for a given manim-web symbol.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Exact symbol name, e.g. "ChoroplethMap".' },
        },
        required: ['name'],
        additionalProperties: false,
      },
    },
  ];

  const server = new Server(
    { name: 'manim-web-mcp', version: '0.1.0' },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, () => ({ tools }));

  server.setRequestHandler(CallToolRequestSchema, (request): CallToolResult => {
    const { name, arguments: args = {} } = request.params;
    const a = args as Record<string, unknown>;
    switch (name) {
      case 'list_symbols':
        return handleListSymbols(index, a);
      case 'describe_symbol':
        return handleDescribeSymbol(index, a);
      case 'search':
        return handleSearch(index, a);
      case 'list_examples':
        return handleListExamples(index);
      case 'get_example':
        return handleGetExample(index, a);
      default:
        return errorResult(`Unknown tool: ${name}`);
    }
  });

  return server;
}

function text(value: string): CallToolResult {
  return { content: [{ type: 'text', text: value }] };
}

function errorResult(message: string): CallToolResult {
  return { content: [{ type: 'text', text: message }], isError: true };
}

function handleListSymbols(index: ApiIndex, args: Record<string, unknown>): CallToolResult {
  const category = typeof args.category === 'string' ? args.category : undefined;
  const kind = typeof args.kind === 'string' ? (args.kind as SymbolKind) : undefined;
  if (kind && !KINDS.includes(kind)) {
    return errorResult(`Invalid kind "${kind}". Valid kinds: ${KINDS.join(', ')}.`);
  }
  const entries = listSymbols(index, { category, kind });
  if (entries.length === 0) {
    const cats = index
      .categories()
      .map((c) => `${c.category} (${c.count})`)
      .join(', ');
    return text(
      `No symbols match${category ? ` category="${category}"` : ''}${
        kind ? ` kind="${kind}"` : ''
      }. Available categories: ${cats}.`,
    );
  }
  const header = `${entries.length} symbol(s)${category ? ` in category "${category}"` : ''}${
    kind ? ` of kind "${kind}"` : ''
  }:`;
  const body = entries
    .map((e) => `- ${e.name} (${e.kind}, ${e.category})${e.summary ? ` — ${e.summary}` : ''}`)
    .join('\n');
  return text(`${header}\n${body}`);
}

function handleDescribeSymbol(index: ApiIndex, args: Record<string, unknown>): CallToolResult {
  const name = typeof args.name === 'string' ? args.name.trim() : '';
  if (!name) return errorResult('describe_symbol requires a "name" string argument.');
  const result = describeSymbol(index, name);
  return result.found ? text(result.text) : text(result.text);
}

function handleSearch(index: ApiIndex, args: Record<string, unknown>): CallToolResult {
  const query = typeof args.query === 'string' ? args.query : '';
  if (!query.trim()) return errorResult('search requires a non-empty "query" string.');
  const hits = search(index, query);
  if (hits.length === 0) return text(`No manim-web symbols match "${query}".`);
  const body = hits
    .map((h) => `- ${h.name} (${h.kind}, ${h.category})${h.summary ? ` — ${h.summary}` : ''}`)
    .join('\n');
  return text(`${hits.length} match(es) for "${query}":\n${body}`);
}

function handleListExamples(index: ApiIndex): CallToolResult {
  const withExamples = index.all().filter((s) => s.examples.length > 0);
  if (withExamples.length === 0) return text('No symbols ship an @example block.');
  const body = withExamples.map((s) => `- ${s.name} (${s.kind}, ${s.category})`).join('\n');
  return text(`${withExamples.length} symbol(s) with examples:\n${body}`);
}

function handleGetExample(index: ApiIndex, args: Record<string, unknown>): CallToolResult {
  const name = typeof args.name === 'string' ? args.name.trim() : '';
  if (!name) return errorResult('get_example requires a "name" string argument.');
  const sym = index.get(name);
  if (!sym) return text(describeSymbol(index, name).text);
  if (sym.examples.length === 0) return text(`"${sym.name}" has no @example block.`);
  return text(`Examples for ${sym.name}:\n\n${sym.examples.join('\n\n')}`);
}

export function createServerFromModel(path?: string): Server {
  return createServer(loadModel(path));
}

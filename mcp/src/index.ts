#!/usr/bin/env node
// manim-web-mcp: stdio MCP server entry point.
//
// Run: node dist/index.js  (or `npx manim-web-mcp` after build).
// It speaks the Model Context Protocol over stdio, so an MCP client (Claude
// Desktop, an IDE, etc.) launches it as a subprocess.

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServerFromModel } from './server.js';

async function main(): Promise<void> {
  const server = createServerFromModel();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Log to stderr only — stdout is the protocol channel.
  process.stderr.write('[manim-web-mcp] server ready on stdio\n');
}

main().catch((err: unknown) => {
  process.stderr.write(`[manim-web-mcp] fatal: ${String(err)}\n`);
  process.exit(1);
});

# manim-web-mcp

A [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server that
exposes **manim-web's real, generated API** to an LLM. An assistant writing
manim-web code can ask this server for true constructor signatures, option
fields and examples instead of guessing them. Every answer is grounded in the
library source, so the model cannot hallucinate a symbol or an option.

This package is **self-contained** and **not part of the manim-web library
bundle**. Its one runtime dependency (the MCP SDK) lives only here and never
enters the library's `dependencies` or `dist/`. It is **not published to npm**.

## What it serves

The server loads `api-model.json` — a compact, grounded API model distilled from
[TypeDoc](https://typedoc.org)'s JSON output of `src/index.ts` (the library's
full public export surface). TypeDoc reads the real TypeScript source, so the
model carries each exported symbol's real signature, its options-interface
fields (name, type, default, JSDoc) and its `@example` blocks.

## Tools

| Tool | Arguments | Returns |
| --- | --- | --- |
| `list_symbols` | `{ category?: string, kind?: "class"\|"interface"\|"function"\|"typeAlias"\|"variable"\|"enum" }` | Exported symbols, optionally filtered. Category is derived from the source module path (e.g. `molecular`, `geo`, `biology`, `graphing`, `three-d`, `text`). |
| `describe_symbol` | `{ name: string }` | The real signature of one symbol. For a class: the constructor plus the inlined fields of its options interface. For a function: the signature, params and return type. Also interface/type/enum/variable definitions, the summary and `@example` blocks. **This is the anti-hallucination tool.** Unknown names return a "did you mean" suggestion. |
| `search` | `{ query: string }` | Ranked keyword matches across symbol names, summaries and option-field names. |
| `list_examples` | `{}` | Every symbol that ships an `@example` block. |
| `get_example` | `{ name: string }` | The `@example` code block(s) for one symbol. |

## Run it

```bash
cd mcp
npm install        # installs the MCP SDK into mcp/node_modules only
npm run build      # compiles src/ to dist/
npm start          # or: node dist/index.js
```

The server speaks MCP over **stdio**, so a client launches it as a subprocess.

### MCP client config

```json
{
  "mcpServers": {
    "manim-web": {
      "command": "node",
      "args": ["/absolute/path/to/manim-web/mcp/dist/index.js"]
    }
  }
}
```

After `npm install` inside `mcp/`, the `manim-web-mcp` bin is also available, so a
client can instead use `"command": "npx", "args": ["manim-web-mcp"]` from a
context where this package is installed.

## Regenerating the API model (keeping it truthful)

The model is generated from the current source, so it always reflects the real
API. Regenerate it after changing the library's public exports:

```bash
cd mcp
npm run build:model   # runs typedoc --json, then distills to api-model.json
```

`scripts/build-api-model.mjs` runs `typedoc --json` (using the repo root's
TypeDoc) into a temp file and distills it to `api-model.json`. The committed
`api-model.json` is the distilled output; the server never runs TypeDoc at
runtime, so it starts fast and works offline.

## Tests

```bash
cd mcp
npm test
```

Tests are offline and fast: they load the committed `api-model.json` and a small
fixture, and assert that `describe_symbol` returns the real options for
`Protein`, `ChoroplethMap` and `DNAHelix`, that `list_symbols` and `search`
behave, and that unknown symbols are handled gracefully.

/**
 * Newick parser for phylogenetic trees.
 *
 * The Newick format encodes a rooted tree as nested parentheses, with optional
 * node names and branch lengths. {@link parseNewick} turns a Newick string into
 * a tree of {@link PhyloNode}. The {@link PhylogeneticTree} mobject draws that
 * tree.
 *
 * Supported syntax:
 * - Nested clades: `(A,B,(C,D));`
 * - Named leaves and named internal nodes: `(A,B)Clade;`
 * - Branch lengths after a colon: `((A:0.1,B:0.2):0.3,C:0.4);`
 * - Quoted names with special characters: `('Genus species (1)',B);`
 *   A doubled single quote inside a quoted name is one literal quote.
 * - A single leaf (`A;`) and a trailing semicolon.
 *
 * A malformed string (unbalanced parentheses, a missing semicolon, an
 * unterminated quote, a missing branch length) throws a clear Error.
 *
 * @example
 * ```typescript
 * const root = parseNewick('((A:0.1,B:0.2):0.3,C:0.4);');
 * root.children.length; // 2
 * ```
 */

/** A node of a parsed phylogenetic tree. A leaf has an empty `children`. */
export interface PhyloNode {
  /** Node name (a leaf label or an internal clade name), if present. */
  name?: string;
  /** Length of the branch from the parent to this node, if present. */
  branchLength?: number;
  /** Child nodes. Empty for a leaf. */
  children: PhyloNode[];
}

/** The characters that end an unquoted name or number token. */
const DELIMITERS = new Set([',', '(', ')', ':', ';']);

/** A recursive-descent parser over one Newick string. */
class NewickParser {
  private pos = 0;

  constructor(private readonly text: string) {}

  /** Parse the whole string into a tree, or throw on malformed input. */
  parse(): PhyloNode {
    const root = this.parseBranch();
    this.skipWhitespace();
    if (this.text[this.pos] !== ';') {
      throw new Error(
        `parseNewick: expected ';' to end the tree at position ${this.pos}, found ${this.describeHere()}`,
      );
    }
    this.pos += 1;
    this.skipWhitespace();
    if (this.pos < this.text.length) {
      throw new Error(`parseNewick: unexpected characters after ';' at position ${this.pos}`);
    }
    return root;
  }

  /** Parse a subtree and its optional `:length` suffix. */
  private parseBranch(): PhyloNode {
    const node = this.parseSubtree();
    this.skipWhitespace();
    if (this.text[this.pos] === ':') {
      this.pos += 1;
      node.branchLength = this.parseNumber();
    }
    return node;
  }

  /** Parse a clade `( ... )name` or a leaf `name`. */
  private parseSubtree(): PhyloNode {
    this.skipWhitespace();
    const children: PhyloNode[] = [];
    if (this.text[this.pos] === '(') {
      this.pos += 1;
      children.push(this.parseBranch());
      this.skipWhitespace();
      while (this.text[this.pos] === ',') {
        this.pos += 1;
        children.push(this.parseBranch());
        this.skipWhitespace();
      }
      if (this.text[this.pos] !== ')') {
        throw new Error(
          `parseNewick: unbalanced parentheses, expected ')' at position ${this.pos}, found ${this.describeHere()}`,
        );
      }
      this.pos += 1;
    }
    const node: PhyloNode = { children };
    const name = this.parseName();
    if (name !== undefined) {
      node.name = name;
    }
    return node;
  }

  /** Parse an optional node name, quoted or bare. Returns undefined if empty. */
  private parseName(): string | undefined {
    this.skipWhitespace();
    if (this.text[this.pos] === "'") {
      return this.parseQuotedName();
    }
    let name = '';
    while (this.pos < this.text.length && !DELIMITERS.has(this.text[this.pos])) {
      name += this.text[this.pos];
      this.pos += 1;
    }
    name = name.trim();
    return name.length > 0 ? name : undefined;
  }

  /** Parse a single-quoted name. A doubled quote `''` is one literal quote. */
  private parseQuotedName(): string {
    this.pos += 1; // consume the opening quote
    let name = '';
    while (this.pos < this.text.length) {
      const ch = this.text[this.pos];
      if (ch === "'") {
        if (this.text[this.pos + 1] === "'") {
          name += "'";
          this.pos += 2;
          continue;
        }
        this.pos += 1; // consume the closing quote
        return name;
      }
      name += ch;
      this.pos += 1;
    }
    throw new Error('parseNewick: unterminated quoted name');
  }

  /** Parse a branch-length number (supports scientific notation). */
  private parseNumber(): number {
    this.skipWhitespace();
    let token = '';
    while (this.pos < this.text.length && /[-0-9eE+.]/.test(this.text[this.pos])) {
      token += this.text[this.pos];
      this.pos += 1;
    }
    if (token.length === 0) {
      throw new Error(`parseNewick: expected a branch length after ':' at position ${this.pos}`);
    }
    const value = Number(token);
    if (!Number.isFinite(value)) {
      throw new Error(`parseNewick: invalid branch length '${token}'`);
    }
    return value;
  }

  /** Advance past spaces, tabs and newlines. */
  private skipWhitespace(): void {
    while (this.pos < this.text.length && /\s/.test(this.text[this.pos])) {
      this.pos += 1;
    }
  }

  /** A short description of the current character, for error messages. */
  private describeHere(): string {
    return this.pos < this.text.length ? `'${this.text[this.pos]}'` : 'end of string';
  }
}

/**
 * Parse a Newick string into a {@link PhyloNode} tree.
 *
 * @param text A Newick string, for example `(A,B,(C,D));`.
 * @throws Error if the string is empty or malformed.
 */
export function parseNewick(text: string): PhyloNode {
  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('parseNewick: the Newick string is empty');
  }
  return new NewickParser(text).parse();
}

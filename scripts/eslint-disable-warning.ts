#!/usr/bin/env -S deno run --allow-read --allow-run

/**
 * Fast ESLint directive checker for Deno
 * Optimized with parallel processing and streaming
 */

const PATTERN = /(\/\/|\/\*|\*|<!--|\{\/\*|#)\s*eslint-(disable|enable)/;

// Use Set for O(1) lookups
const EXCLUDE_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  ".git",
  ".deno",
]);

interface Match {
  file: string;
  line: number;
  content: string;
}

async function isGitRepo(): Promise<boolean> {
  try {
    const cmd = new Deno.Command("git", {
      args: ["rev-parse", "--is-inside-work-tree"],
      stdout: "null",
      stderr: "null",
    });
    const { success } = await cmd.output();
    return success;
  } catch {
    return false;
  }
}

async function getGitTrackedFiles(): Promise<string[]> {
  const cmd = new Deno.Command("git", {
    args: ["ls-files"],
    stdout: "piped",
  });
  const { stdout } = await cmd.output();
  return new TextDecoder()
    .decode(stdout)
    .split("\n")
    .filter((f) => f.length > 0);
}

// Parallel file search
async function searchFilesParallel(
  files: string[],
  repoRoot: string,
): Promise<Match[]> {
  const scriptPath = import.meta.filename || "";
  const results: Match[] = [];

  // Process in chunks for better memory management
  const chunkSize = 100;
  const chunks = [];

  for (let i = 0; i < files.length; i += chunkSize) {
    chunks.push(files.slice(i, i + chunkSize));
  }

  for (const chunk of chunks) {
    const chunkPromises = chunk.map(async (file) => {
      const fullPath = `${repoRoot}/${file}`;
      if (fullPath === scriptPath) return [];

      try {
        const stats = await Deno.stat(fullPath);
        if (!stats.isFile) return [];

        // Read file and search in one pass
        const content = await Deno.readTextFile(fullPath);
        const lines = content.split("\n");
        const matches: Match[] = [];

        for (let i = 0; i < lines.length; i++) {
          if (PATTERN.test(lines[i])) {
            matches.push({
              file: fullPath,
              line: i + 1,
              content: lines[i].trim(),
            });
          }
        }
        return matches;
      } catch {
        return [];
      }
    });

    const chunkResults = await Promise.all(chunkPromises);
    for (const matches of chunkResults) {
      results.push(...matches);
    }
  }

  return results;
}

// Optimized recursive file walker with sync operations (faster for small repos)
function getAllFilesSync(dir: string): string[] {
  const files: string[] = [];

  try {
    for (const entry of Deno.readDirSync(dir)) {
      const fullPath = `${dir}/${entry.name}`;

      if (entry.isDirectory) {
        if (!EXCLUDE_DIRS.has(entry.name) && !entry.name.startsWith(".")) {
          files.push(...getAllFilesSync(fullPath));
        }
      } else if (entry.isFile) {
        files.push(fullPath);
      }
    }
  } catch {
    // Skip unreadable directories
  }

  return files;
}

async function main() {
  const startTime = performance.now();
  const repoRoot = Deno.cwd();

  let files: string[];

  if (await isGitRepo()) {
    files = await getGitTrackedFiles();
  } else {
    files = getAllFilesSync(repoRoot);
  }

  // Filter and search in parallel
  const allMatches = await searchFilesParallel(files, repoRoot);

  if (allMatches.length > 0) {
    console.error(
      "✖ Found 'eslint-disable'/'eslint-enable' directive(s) (banned — see issue #398):",
    );
    console.error("");

    // Group by file for cleaner output
    const grouped = new Map<string, typeof allMatches>();
    for (const match of allMatches) {
      if (!grouped.has(match.file)) {
        grouped.set(match.file, []);
      }
      grouped.get(match.file)!.push(match);
    }

    for (const [file, matches] of grouped) {
      for (const match of matches) {
        console.error(`${file}:${match.line}: ${match.content}`);
      }
    }

    console.error("");
    console.error("Fix the underlying lint problem instead of suppressing it.");
    Deno.exit(1);
  }

  const endTime = performance.now();
  console.log(
    `✓ No 'eslint-disable' directives anywhere in the repo. (${
      (endTime - startTime).toFixed(2)
    }ms)`,
  );
}

await main();

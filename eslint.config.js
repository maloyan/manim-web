import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  {
    ignores: ["dist/", "node_modules/", "docs/"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    rules: {
      "@typescript-eslint/naming-convention": [
        "warn",
        { selector: "class", format: ["PascalCase"] },
        { selector: "interface", format: ["PascalCase"] },
        { selector: "typeAlias", format: ["PascalCase"] },
        { selector: "enum", format: ["PascalCase"] },
        { selector: "enumMember", format: ["UPPER_CASE", "PascalCase"] },
        { selector: "function", format: ["camelCase", "PascalCase"] },
        { selector: "method", format: ["camelCase"] },
        { selector: "variable", format: ["camelCase", "UPPER_CASE", "PascalCase"] },
        {
          selector: "parameter",
          format: ["camelCase"],
          leadingUnderscore: "allow",
        },
      ],
      "no-warning-comments": [
        "warn",
        { terms: ["TODO", "FIXME", "HACK", "XXX"] },
      ],
      "max-lines": [
        "warn",
        { max: 500, skipBlankLines: true, skipComments: true },
      ],
      complexity: ["warn", 15],

      // Dead/unused code detection
      // TS-aware version of no-unused-vars (disable base rule to avoid conflicts)
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // Catch expressions that don't affect state (e.g. `x + 1;` with no assignment)
      "no-unused-expressions": "off",
      "@typescript-eslint/no-unused-expressions": "warn",
      // Verify recommended rules are active at error level (explicit for visibility)
      "no-unreachable": "error",
      "no-constant-condition": "error",
      "no-empty": "error",
    },
  },
];

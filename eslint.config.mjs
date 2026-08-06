// @ts-check

import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import stylistic from "@stylistic/eslint-plugin";

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  tseslint.configs.stylistic,
  stylistic.configs.recommended,
  prettierConfig,
  {
    rules: {
      "no-console": ["error"],
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.object.object.name='game'][callee.object.property.name='settings'][callee.property.name='get']",
          message: "Use utils.getSetting<T>(key, moduleId?) instead of game.settings.get().",
        },
      ],
      "@stylistic/member-delimiter-style": [
        "error",
        {
          multiline: {
            delimiter: "semi",
            requireLast: true,
          },
          singleline: {
            delimiter: "semi",
            requireLast: false,
          },
          multilineDetection: "brackets",
        },
      ],
      "@stylistic/arrow-parens": ["error", "always"],
      "@stylistic/arrow-spacing": [
        "error",
        {
          "after": true,
          "before": true,
        },
      ],
      "@stylistic/array-bracket-newline": ["error", "consistent"],
      "@stylistic/array-bracket-spacing": ["error", "never"],
      "@stylistic/block-spacing": "error",
      "@stylistic/no-multiple-empty-lines": ["error", { max: 2, maxEOF: 1 }],
      "@stylistic/quotes": ["error", "double", { "allowTemplateLiterals": "always" }],
      "@stylistic/semi": ["error", "always"],
      "@stylistic/semi-style": ["error", "last"],
      "@stylistic/linebreak-style": ["error", "unix"],
      "@stylistic/comma-dangle": [2, {
        "arrays": "always-multiline",
        "objects": "always-multiline",
        "imports": "always-multiline",
        "exports": "always-multiline",
        "functions": "always-multiline",
      }],
      "@stylistic/comma-spacing": [
        "error",
        {
          "after": true,
          "before": false,
        },
      ],
      "@stylistic/comma-style": ["error", "last"],
      "@stylistic/computed-property-spacing": ["error", "never"],
      "@stylistic/semi-spacing": [
        "error",
        {
          "after": true,
          "before": false,
        },
      ],
      "@stylistic/padded-blocks": "off",
      "@stylistic/no-tabs": "error",
      "@stylistic/indent": ["error", 2, { SwitchCase: 1 }],
      "@stylistic/spaced-comment": ["error", "always"],
      "@stylistic/space-in-parens": ["error", "never"],
      "@stylistic/space-infix-ops": "error",
      "@stylistic/switch-colon-spacing": "error",
      "@stylistic/rest-spread-spacing": "error",
      "@stylistic/wrap-regex": "error",
      "@stylistic/wrap-iife": "error",
      "@stylistic/template-curly-spacing": ["error", "never"],
      "@stylistic/template-tag-spacing": "error",
      "@stylistic/eol-last": "error",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/prefer-for-of": "off",
      "@typescript-eslint/class-literal-property-style": "off",
      "@stylistic/brace-style": ["error", "1tbs", { allowSingleLine: false }],
      "@stylistic/lines-between-class-members": ["off"],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    // the getSetting wrapper itself, and Logger (cannot import Utils without
    // risking an import cycle), are allowed to call game.settings.get directly
    files: ["src/lib/Utils.ts", "src/lib/Logger.ts"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  // Layer guards. These keep the barrel-import cycles from coming back (they
  // are what forced tests to vi.mock the barrels). NOTE: flat config replaces
  // rather than merges rule options, so the config/lib blocks below must
  // repeat the self-barrel pattern.
  {
    // importing your own package's barrel re-enters every sibling module and
    // manufactures cycles; import sibling files directly.
    files: ["src/**/*.ts"],
    ignores: ["src/api.ts"], // api.ts re-exports the root barrel as the public surface
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          regex: "^\\./_module$",
          message: "Do not import your own barrel; import the sibling file directly.",
        }],
      }],
    },
  },
  {
    // src/config is a leaf package: pure data only. An import into module code
    // recreates the config <-> lib barrel cycle.
    files: ["src/config/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          regex: "^\\./_module$",
          message: "Do not import your own barrel; import the sibling file directly.",
        }, {
          regex: "^(\\.\\./)+(lib|effects|parser|muncher|apps|hooks|updater)/",
          message: "src/config is a leaf package; do not import module code into it.",
        }],
      }],
    },
  },
  {
    // lib sits below effects and parser; a static import upward recreates the
    // barrel cycles. Lazy import() at the call site is fine (not flagged).
    files: ["src/lib/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          regex: "^\\./_module$",
          message: "Do not import your own barrel; import the sibling file directly.",
        }, {
          regex: "^(\\.\\./)+(effects|parser)/",
          message: "src/lib must not statically import effects or parser; use a lazy import() if needed.",
        }],
      }],
    },
  },
  {
    // One-off scripts that predate tools/ being linted. New tooling under
    // tools/ is linted by `npm run lint`; drop entries here as they are cleaned
    // up rather than adding to the list.
    ignores: [
      "tools/build-module-json.js",
      "tools/create-symlinks.mjs",
      "tools/fetch-ddb-config.mjs",
      "tools/foundry-dev-link.mjs",
      "tools/get-version.js",
      "tools/test-grid-detector.mjs",
    ],
  },
);

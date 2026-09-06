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
  // Layer guards. These keep the barrel-import cycles from coming back: the test harness loads
  // modules in ESM order, where a cycle through a barrel surfaces as a TDZ crash in a static
  // initialiser (see tests/smoke/enricherFirstLoad.test.ts).
  {
    // src/config is a leaf package: pure data only. An import into module code
    // recreates the config <-> lib barrel cycle.
    files: ["src/config/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          regex: "^(\\.\\./)+(lib|effects|parser|muncher|apps|hooks|updater)/",
          message: "src/config is a leaf package; do not import module code into it.",
        }],
      }],
    },
  },
  {
    // These files form the transitive import closure of DDBEnricherData, which
    // must finish evaluating before any enricher class `extends` it. A static
    // import of a heavy barrel from here re-enters the enricher tree
    // mid-evaluation and crashes with a TDZ error. config/_module and the small
    // enrichers/effects/_module sub-barrel are deliberately not restricted.
    files: [
      "src/parser/enrichers/data/**/*.ts",
      "src/parser/enrichers/effects/**/*.ts",
      "src/parser/lib/{DDBDataUtils,DDBTemplateStrings,DDBReferenceLinker,DDBDescriptions,DDBModifiers,ProficiencyFinder,SpecialAdvancements,SystemHelpers}.ts",
      "src/parser/spells/SpellDataUtils.ts",
      "src/effects/DDBEffectHelperText.ts",
    ],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          regex: "(^|/)lib/_module$|\\.\\./_module$",
          message: "This file is in DDBEnricherData's import closure; import specific files, not barrels (config/_module and enrichers/effects/_module are fine).",
        }],
      }],
    },
  },
);

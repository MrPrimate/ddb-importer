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
);

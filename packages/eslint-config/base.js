import js from "@eslint/js"
import globals from "globals"
import tseslint from "typescript-eslint"

/** Shared ESLint flat config for TypeScript packages in the Tabaca monorepo. */
export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/.output/**",
      "**/.wxt/**",
      "**/.turbo/**",
      "**/dist/**"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node }
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ]
    }
  }
)

import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tseslint from "typescript-eslint"
import base from "./base.js"

/** Shared ESLint flat config for React apps in the Tabaca monorepo. */
export default tseslint.config(
  ...base,
  {
    files: ["**/*.{ts,tsx}"],
    ...reactHooks.configs.flat.recommended
  },
  {
    files: ["**/*.tsx"],
    ...reactRefresh.configs.vite
  }
)

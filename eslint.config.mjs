import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      'no-unused-expressions': 'off', 
      'import/no-anonymous-default-export': 'off', 
    },
    env: {
      browser: true,
      node: true,
      es2021: true,
    },
  },
];
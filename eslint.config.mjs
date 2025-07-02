import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";

const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL(".", import.meta.url));
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: pluginJs.configs.recommended,
});

export default [
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
  },
  ...compat.extends("xo-typescript"),
  {
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      'react': pluginReact,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn', 
        { 
          vars: 'all', 
          varsIgnorePattern: '^inter$', 
          args: 'after-used',
          argsIgnorePattern: '^_'
        }
      ],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    }
  }
];

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', '**/*.test.ts', '**/*.test.tsx', '**/__tests__/**']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Make 'any' a warning instead of error - allows commits but shows issues
      '@typescript-eslint/no-explicit-any': 'warn',
      // Make react-refresh warnings instead of errors
      'react-refresh/only-export-components': 'warn',
      // Allow unused vars that start with _
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrors: 'none' // Don't error on unused catch variables
      }],
      // Make React hooks deps warnings instead of errors
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
])

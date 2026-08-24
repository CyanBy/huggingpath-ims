import js from '@eslint/js'
import globals from 'globals'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['src/**/*.{ts,vue}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      ...pluginVue.configs['flat/recommended'],
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        parser: tseslint.parser,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'vue/first-attribute-linebreak': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/html-self-closing': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/one-component-per-file': 'off',
      'vue/require-default-prop': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-indent': 'off',
    },
  },
])

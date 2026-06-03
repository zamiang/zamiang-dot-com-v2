import eslintPluginAstro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

const eslintConfig = [
  {
    ignores: [
      '.astro/**',
      '.vercel/**',
      'dist/**',
      'node_modules/**',
      '.cache/**',
      'coverage/**',
    ],
  },
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      // Allow dropping a prop via a rest sibling, e.g.
      // `function CodeTag({ style, ...rest })` in ContentRenderer.tsx.
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },
  {
    files: ['**/__tests__/**/*.ts', '**/__tests__/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];

export default eslintConfig;

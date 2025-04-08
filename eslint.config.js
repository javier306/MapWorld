import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import importPlugin from 'eslint-plugin-import';

export default [
  {
    ignores: ['dist'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        __dirname: 'readonly', // Para evitar problemas con Node.js
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: {
          jsx: true,
          tsx: true, // Habilita soporte para TypeScript si lo usas
        },
        sourceType: 'module',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      import: importPlugin, // Para ayudar con la organización de imports
    },
    extends: [
      'eslint:recommended', // Habilita las reglas recomendadas de ESLint
      'plugin:react/recommended', // Reglas recomendadas para React
      'plugin:react-hooks/recommended', // Reglas recomendadas para React Hooks
      'plugin:import/errors', // Mejora el manejo de imports
      'plugin:import/warnings',
      'plugin:import/typescript', // Para TypeScript si se utiliza
    ],
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'import/no-unresolved': 'error', // Error si un import no se puede resolver
      'import/named': 'error', // Asegura que todos los imports sean correctos
      'react/prop-types': 'off', // Desactiva la validación de tipos si usas TypeScript
      'react/react-in-jsx-scope': 'off', // Si usas React 17 o superior, ya no es necesario importar React en cada archivo
      'react/jsx-uses-react': 'off', // Ya no es necesario con React 17+ en JSX
      'react/jsx-uses-vars': 'error', // Para evitar que React se marque como no utilizado
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    parserOptions: {
      ecmaVersion: 2020,
      project: './tsconfig.json', // Ajusta según la ubicación de tu tsconfig
    },
    extends: [
      'plugin:@typescript-eslint/recommended', // Reglas recomendadas para TypeScript
      'plugin:import/typescript', // Para manejar imports en TypeScript
    ],
    plugins: ['@typescript-eslint'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      '@typescript-eslint/explicit-module-boundary-types': 'off', // Desactivar la necesidad de tipos explícitos en funciones
    },
  },
];

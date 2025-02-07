module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  plugins: [
    '@typescript-eslint',
    'node',
    'security',
    '@getify/proper-ternary',
  ],
  extends: [
    'airbnb-base',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:node/recommended',
    'plugin:security/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:@getify/proper-ternary/getify-says',
    "prettier"
  ],
  rules: {
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-inferrable-types': ['error', {
      ignoreParameters: false,
      ignoreProperties: false,
    }],
    "@typescript-eslint/no-misused-promises": [
      "error",
      {
        "checksVoidReturn": false
      }
    ],
    '@typescript-eslint/no-unnecessary-type-assertion': 'off',
    'import/newline-after-import': 'off',
    'import/no-named-as-default': 'off',
    'import/extensions': 'off',
    'import/no-unresolved': 'off',
    'import/named': 'off',
    'import/first': 'off',
    '@getify/proper-ternary/where': 'off',
    '@getify/proper-ternary/nested': ['error', { test: false, then: true, else: false }],
    '@getify/proper-ternary/parens': 'off',
    'object-shorthand': 'off',
    'node/no-missing-import': 'off',
    'node/no-unsupported-features/es-syntax': [
      'error',
      {
        ignores: [
          'dynamicImport',
          'modules',
        ],
      },
    ],
    'arrow-parens': [
      'error',
      'as-needed',
      {
        requireForBlockBody: true,
      },
    ],
    'no-sequences': 'error',
    'one-var': 'off',
    'class-methods-use-this': 'off',
    'one-var-declaration-per-line': 'off',
    'consistent-return': 'off',
    'func-names': 'off',
    'max-len': 'off',
    'no-unused-expressions': 'off',
    'no-console': 'off',
    'no-shadow': [
      'error',
      { hoist: 'never' },
    ],
    'no-param-reassign': 'off',
    'no-prototype-builtins': 'off',
    'no-new': 'off',
    'newline-per-chained-call': 'off',
    'no-lonely-if': 'off',
    'no-new-object': 'error',
    'no-plusplus': 'off',
    'no-bitwise': 'off',
    'object-curly-newline': [
      'error',
      {
        multiline: true,
        consistent: true,
      },
    ],
    'no-underscore-dangle': 'off',
    'prefer-destructuring': 'off',
    'space-before-blocks': 'off',
    'space-before-function-paren': ['error', {"anonymous": "always", "named": "never", "asyncArrow": "always"}],
    'prefer-rest-params': 'off',
    'no-undef': 'off',
    default: 'off',
    'lines-between-class-members': 'off',
    camelcase: 'off',
    'max-classes-per-file': 'off',
    'spaced-comment': 'off',
    'security/detect-object-injection': 'off',
    'security/detect-non-literal-fs-filename': 'off',
  },
};

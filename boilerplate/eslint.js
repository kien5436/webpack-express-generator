module.exports = (rule) => ({
  browser: {
    'env': {
      'browser': true,
      'es6': true,
    },
    'extends': 'pk' === rule ? ['pk', 'pk/eslint-browser'] : 'eslint:recommended',
    'ignorePatterns': ['assets/**', 'webpack/**'],
    'parserOptions': {
      'ecmaVersion': 6,
      'sourceType': 'module',
    },
  },
  node: 'pk' === rule ? { extends: 'pk' } : {
    'env': {
      'es2021': true,
      'node': true,
    },
    'extends': 'eslint:recommended',
    'ignorePatterns': ['**/node_modules/**'],
    'parserOptions': { 'ecmaVersion': 12 },
    'reportUnusedDisableDirectives': true,
  },
});
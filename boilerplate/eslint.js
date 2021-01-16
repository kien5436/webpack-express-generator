module.exports = (rule) => ({
  browser: {
    'extends': 'pk' === rule ? ['pk/eslint-browser'] : 'eslint:recommended',
    'ignorePatterns': ['assets/**', 'webpack/**'],
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
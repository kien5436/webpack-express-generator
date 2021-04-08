module.exports = (name) => ({
  name,
  'version': '1.0.0',
  'description': '',
  'main': 'index.js',
  'scripts': {
    'dev': 'cross-env NODE_ENV=development nodemon index.js',
    'start': 'cross-env NODE_ENV=production node index.js',
  },
  'dependencies': {
    'dotenv': '^8.2.0',
    'express': '^4.17.1',
    'morgan': '^1.10.0',
  },
  'devDependencies': {
    'clean-webpack-plugin': '^3.0.0',
    'cross-env': '^5.2.0',
    'css-loader': '^3.0.0',
    "css-minimizer-webpack-plugin": "^1.3.0",
    'mini-css-extract-plugin': '^0.7.0',
    'nodemon': '^1.19.1',
    'webpack': '^5.30.0',
    'webpack-dev-middleware': '^4.1.0',
  },
  'nodemonConfig': {
    'ignore': [
      'node_modules/',
      'client/src/',
      'client/assets/',
    ],
  },
});
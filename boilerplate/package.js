module.exports = (name, eslint = false) => ({
  name,
  'version': '1.0.0',
  'description': '',
  'main': 'index.js',
  'scripts': {
    'build': 'webpack --config client/webpack/config.prod.js',
    'dev': 'cross-env NODE_ENV=development nodemon index.js',
    'lint': eslint ? 'eslint -c .eslintrc.json --ext .js .' : undefined,
    'start': 'cross-env NODE_ENV=production node index.js',
  },
  'dependencies': {
    'dotenv': '^8.2.0',
    'express': '^4.17.1',
  },
  'devDependencies': {
    'clean-webpack-plugin': '^3.0.0',
    'cross-env': '^5.2.0',
    'css-loader': '^3.0.0',
    'eslint': eslint ? '^7.8.1' : undefined,
    'file-loader': '^4.0.0',
    'mini-css-extract-plugin': '^0.7.0',
    'node-sass': '^4.12.0',
    'nodemon': '^1.19.1',
    'optimize-css-assets-webpack-plugin': '^5.0.1',
    'sass-loader': '^7.1.0',
    'webpack': '^4.35.0',
    'webpack-cli': '^3.3.4',
    'webpack-dev-middleware': '^3.7.0',
    'webpack-manifest-plugin': '^2.0.4',
  },
  'nodemonConfig': {
    'ignore': [
      'node_modules/',
      'client/src/',
    ],
  },
});
const { merge } = require('webpack-merge');

const shared = require('./shared');

module.exports = (env) => {

  switch (env) {
    case 'production':
      const configProd = require('./config.prod');
      return merge(configProd, shared);
    default:
      const configDev = require('./config.dev');
      return merge(configDev, shared);
  }
}
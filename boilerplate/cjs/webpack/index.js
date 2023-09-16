const { merge } = require('webpack-merge');

const sharedConfig = require('./shared');

/**
 * @param {string} env
 * @returns {import('webpack').Configuration}
 */
module.exports = (env) => {

  switch (env) {
    case 'production':
      const prodConfig = require('./config.prod');
      return merge(prodConfig, sharedConfig);
    default:
      const devConfig = require('./config.dev');
      return merge(devConfig, sharedConfig);
  }
}
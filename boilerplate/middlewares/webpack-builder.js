const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');

const env = require('../config/env');
const configDev = require('../client/webpack/config.dev');
const configProd = require('../client/webpack/config.prod');

const compiler = webpack('production' !== env.NODE_ENV ? configDev : configProd);

function webpackMiddleware() {

  return new Promise((resolve, reject) => {

    compiler.run((err, stats) => {

      if (err) {

        reject(err);
        return;
      }

      resolve(stats.toJson({
        all: false,
        assets: true,
        assetsSort: 'name',
        entrypoints: true,
        errorDetails: true,
        errors: true,
        logging: 'warn',
        performance: true,
        warnings: true,
      }));
    });
  });
}

module.exports = 'production' !== env.NODE_ENV ? webpackDevMiddleware(compiler, {
  publicPath: configDev.output.publicPath,
  serverSideRender: true,
  stats: 'normal',
  writeToDisk: false,
}) : webpackMiddleware;
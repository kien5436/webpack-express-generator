const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');

const env = require('../config/env');
const configDev = require('../client/webpack/config.dev');
const configProd = require('../client/webpack/config.prod');

const compiler = webpack('production' !== env.NODE_ENV ? configDev : configProd);

async function webpackProdMiddleware(req, res, next) {

  try {
    if (!res.app.get('webpackStats')) {

      console.log('webpack: building');

      const webpackStats = await new Promise((resolve, reject) => {

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
      req.app.set('webpackStats', webpackStats);
    }
    next();
  }
  catch (err) {
    next(err);
  }
}

module.exports = 'production' !== env.NODE_ENV ? webpackDevMiddleware(compiler, {
  publicPath: configDev.output.publicPath,
  serverSideRender: true,
  stats: 'minimal',
  writeToDisk: false,
}) : webpackProdMiddleware;
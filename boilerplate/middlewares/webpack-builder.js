const { promisify } = require('util');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');

const { NODE_ENV } = require('../config/env');
const config = require('../client/webpack')(NODE_ENV);

const compiler = webpack(config);
const statsOptions = {
  all: false,
  assets: true,
  assetsSort: 'name',
  entrypoints: true,
  errorDetails: true,
  errors: true,
  logging: 'warn',
  performance: true,
  warnings: true,
};
const webpackClose = promisify(compiler.close).bind(compiler);
const webpackRun = promisify(compiler.run).bind(compiler);

async function webpackProdMiddleware(req, res, next) {

  try {
    if (!res.app.get('webpackStats')) {

      console.log('webpack: building');

      const stats = await webpackRun();
      await webpackClose();
      const { assets, errors, warnings, entrypoints } = stats.toJson(statsOptions);

      req.app.set('webpackStats', { assets, errors, warnings, entrypoints });
    }

    next();
  }
  catch (err) {
    next(err);
  }
}

module.exports = 'production' !== NODE_ENV ? [webpackDevMiddleware(compiler, {
  publicPath: config.output.publicPath,
  serverSideRender: true,
  stats: 'minimal',
  writeToDisk: false,
}), (req, res, next) => {

  const { assets, errors, warnings, entrypoints } = res.locals.webpack.devMiddleware.stats.toJson(statsOptions);

  res.app.set('webpackStats', { assets, errors, warnings, entrypoints });

  next();
}] : webpackProdMiddleware;
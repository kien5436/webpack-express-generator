const { promisify } = require('util');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');

const { NODE_ENV } = require('../config/env');
const config = require('../webpack')(NODE_ENV);

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

async function webpackBuilderProdMiddleware(req, res, next) {

  const compiler = webpack(config);
  const webpackClose = promisify(compiler.close).bind(compiler);
  const webpackRun = promisify(compiler.run).bind(compiler);

  try {
    if (!res.app.get('webpackStats')) {

      console.log('webpack: building');

      const stats = await webpackRun();
      await webpackClose();
      const { assets, errors, warnings, entrypoints } = stats.toJson(statsOptions);

      req.app.set('webpackStats', { assets, entrypoints, errors, warnings });
    }

    next();
  }
  catch (err) {
    next(err);
  }
}

function webpackBuilderDevMiddleware() {

  for (const entry in config.entry) {

    config.entry[entry].unshift('webpack-hot-middleware/client?quiet=true');
  }

  const compiler = webpack(config);

  return [
    webpackDevMiddleware(compiler, {
      publicPath: config.output.publicPath,
      serverSideRender: true,
      stats: 'minimal',
      writeToDisk: false,
    }), (req, res, next) => {

      const { assets, errors, warnings, entrypoints } = res.locals.webpack.devMiddleware.stats.toJson(statsOptions);

      res.app.set('webpackStats', { assets, entrypoints, errors, warnings });

      next();
    },
    webpackHotMiddleware(compiler),
  ];
}

module.exports = 'production' !== NODE_ENV ? webpackBuilderDevMiddleware() : webpackBuilderProdMiddleware;
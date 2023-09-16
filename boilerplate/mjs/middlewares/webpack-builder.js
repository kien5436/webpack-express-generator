import { promisify } from 'util';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';

import { NODE_ENV } from '../config/env';
import wpConfig from '../webpack';

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
const config = wpConfig(NODE_ENV);

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

      req.app.set('webpackStats', { assets, errors, warnings, entrypoints });
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

      res.app.set('webpackStats', { assets, errors, warnings, entrypoints });

      next();
    },
    webpackHotMiddleware(compiler),
  ];
}

export default 'production' !== NODE_ENV ? webpackBuilderDevMiddleware() : webpackBuilderProdMiddleware;
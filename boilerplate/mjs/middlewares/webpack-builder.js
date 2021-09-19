import { promisify } from 'util';
import webpack from 'webpack';
import devMiddleware from 'webpack-dev-middleware';

import { NODE_ENV } from '../config/env';
import wpConfig from '../webpack';

const config = wpConfig(NODE_ENV);
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

function webpackDevMiddleware() {

  return [devMiddleware(compiler, {
    publicPath: config.output.publicPath,
    serverSideRender: true,
    stats: 'minimal',
    writeToDisk: false,
  }), (req, res, next) => {

    const { assets, errors, warnings, entrypoints } = res.locals.webpack.devMiddleware.stats.toJson(statsOptions);

    res.app.set('webpackStats', { assets, errors, warnings, entrypoints });

    next();
  }]
}

export default 'production' !== NODE_ENV ? webpackDevMiddleware() : webpackProdMiddleware;
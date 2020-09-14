const express = require('express');
const { resolve } = require('path');

const app = express();
const env = require('./env');
const routes = require('../routes');
const { setAssets } = require('../middlewares/asset-manager');
const errorHandler = require('../middlewares/error-handler');

if ('production' !== env.NODE_ENV) {

  const webpackDevMiddleware = require('webpack-dev-middleware');

  const config = require('../client/webpack/config.dev');
  const compiler = require('webpack')(config);

  app.use(webpackDevMiddleware(compiler, {
    publicPath: config.output.publicPath,
    serverSideRender: true,
    stats: 'errors-warnings',
    writeToDisk: false,
  }));
}
app.set('view engine', '<@ engine @>');
app.use(setAssets);
app.use('/assets', express.static(resolve('client/assets')));
app.use('/', routes);
app.use(errorHandler);

module.exports = app;
const { resolve } = require('path');
const express = require('express');
const logger = require('morgan');

const app = express();
const env = require('./env');
const routes = require('../routes');
const errorHandler = require('../middlewares/error-handler');
const webpackBuilder = require('../middlewares/webpack-builder');

async function main() {

  if ('production' !== env.NODE_ENV) {
    app.use(webpackBuilder);
  }
  else {
    try {
      const webpackStats = await webpackBuilder();

      app.set('webpackStats', webpackStats);
    }
    catch (err) {
      console.error(err);
    }
  }

  app.set('view engine', '<@ engine @>');
  app.use(logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/assets', express.static(resolve('client/assets')));
  app.use('/', routes);
  app.use(errorHandler);
}

main();

module.exports = app;
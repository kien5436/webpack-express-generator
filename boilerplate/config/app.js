const { resolve } = require('path');
const express = require('express');
const logger = require('morgan');

const app = express();
const env = require('./env');
const routes = require('../routes');
const errorHandler = require('../middlewares/error-handler');
const webpackBuilder = require('../middlewares/webpack-builder');

(async function() {

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

  app.set('view engine', '<@ engine @>')
    .use(logger('dev'))
    .use(express.json())
    .use(express.urlencoded({ extended: true }))
    .use('/assets', express.static(resolve('client/assets')))
    .use('/', routes)
    .use(errorHandler);
})();

module.exports = app;
const { resolve } = require('path');
const express = require('express');
const logger = require('morgan');

const app = express();
const routes = require('../routes');
const errorHandler = require('../middlewares/error-handler');
const webpackBuilder = require('../middlewares/webpack-builder');

module.exports = function () {

  app.set('view engine', '<@ engine @>')
    .use(express.json())
    .use(express.urlencoded({ extended: true }))
    .use('/assets', express.static(resolve('public/assets')))
    .use(logger('dev'))
    .use('/', webpackBuilder, routes)
    .use(errorHandler);

  return app;
}

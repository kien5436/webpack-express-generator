const { resolve } = require('path');
const express = require('express');
const logger = require('morgan');

const app = express();
const routes = require('../routes');
const errorHandler = require('../middlewares/error-handler');
const webpackBuilder = require('../middlewares/webpack-builder');

(function () {

  app.set('view engine', '<@ engine @>')
    .use(express.json())
    .use(express.urlencoded({ extended: true }))
    .use('/assets', express.static(resolve('client/assets')))
    .use(logger('dev'))
    .use('/', webpackBuilder, routes)
    .use(errorHandler);
})();

module.exports = app;
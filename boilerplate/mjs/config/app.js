import { resolve } from 'path';
import express from 'express';
import logger from 'morgan';

import routes from '../routes';
import errorHandler from '../middlewares/error-handler';
import webpackBuilder from '../middlewares/webpack-builder';

const app = express();

export default function() {

  app.set('view engine', '<@ engine @>')
    .use(express.json())
    .use(express.urlencoded({ extended: true }))
    .use(webpackBuilder)
    .use('/assets', express.static(resolve('public/assets')))
    .use(logger('dev'))
    .use('/', routes)
    .use(errorHandler);

  return app;
}
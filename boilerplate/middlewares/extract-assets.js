const env = require('../config/env');

/**
 * extract assets from entries to the view,
 * assets available at `res.locals.assets`
 * @param  {string} entry entry name defined in webpack
 */
module.exports = (entry) => (req, res, next) => {

  const webpackStats = 'production' !== env.NODE_ENV ? res.locals.webpackStats.toJson({
    all: false,
    assets: true,
    assetsSort: 'name',
    entrypoints: true,
    errorDetails: true,
    errors: true,
    logging: 'warn',
    warnings: true,
  }) : res.app.get('webpackStats');

  if ((webpackStats.hasOwnProperty('hasErrors') && webpackStats.hasErrors()) || 0 < webpackStats.errors.length) {

    const err = new Error();
    err.errors = webpackStats.errors;
    err.errorDetails = webpackStats.errorDetails;

    next(err);
    return;
  }

  if (webpackStats.hasOwnProperty('hasWarnings') && webpackStats.hasWarnings() || 0 < webpackStats.warnings.length) {
    console.log(webpackStats.warnings);
  }

  const { assets } = webpackStats.entrypoints[entry];
  const css = [];
  const js = [];

  for (let i = assets.length; 0 <= --i;) {

    const asset = 'assets/' + assets[i];

    if (asset.endsWith('.css')) {
      css.push(asset);
    }
    else if (asset.endsWith('.js')) {
      js.push(asset);
    }
  }

  res.locals.assets = { css, js };

  next();
};
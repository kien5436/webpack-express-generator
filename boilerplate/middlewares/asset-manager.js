const { resolve } = require('path');
const { promises: { readFile } } = require('fs');

const env = require('../config/env');

/**
 * extract assets from entries to the view,
 * assets available at `res.locals.assets`
 * @param  {string} entries list of entry names defined in webpack
 */
exports.getAssets = (...entries) => (req, res, next) => {

  const assets = res.assets;
  let css = [];
  let js = [];
  let asset = null;

  for (let i = entries.length; 0 <= --i;) {

    asset = assets[entries[i]];
    asset = Array.isArray(asset) ? asset : [asset ];

    let cssPaths = asset.filter((path) => path.endsWith('.css'));
    let jsPaths = asset.filter((path) => path.endsWith('.js'));

    if ('production' !== env.NODE_ENV) {

      cssPaths = cssPaths.map((path) => '/assets/' + path);
      jsPaths = jsPaths.map((path) => '/assets/' + path);
    }

    css = [...css, ...cssPaths ];
    js = [...js, ...jsPaths ];
  }

  res.locals.assets = { css, js };

  next();
};

exports.setAssets = async (req, res, next) => {

  try {
    res.assets = 'production' === env.NODE_ENV ?
      // for large manifest, cache content to improve performance
      JSON.parse(await readFile(resolve('client/webpack/manifest.json'), 'utf8')) :
      res.locals.webpackStats.toJson().assetsByChunkName;

    next();
  }
  catch (err) {
    next(err);
  }
};
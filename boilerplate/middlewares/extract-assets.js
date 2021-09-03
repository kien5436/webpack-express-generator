const others = {};

/**
 * extract assets from entries to the view,
 * assets available at `res.locals.assets`
 * @param {string} entry entry name defined in webpack
 */
module.exports = (entry) => (req, res, next) => {

  const webpackStats = res.app.get('webpackStats');

  if (0 < webpackStats.errors.length) {

    const err = new Error();
    err.errors = webpackStats.errors;
    err.errorDetails = webpackStats.errorDetails;

    next(err);
    return;
  }

  if (0 < webpackStats.warnings.length) {
    console.log(webpackStats.warnings);
  }

  const { assets, entrypoints } = webpackStats;
  const assetsOfEntry = entrypoints[entry].assets;
  const css = [];
  const js = [];
  others[entry] = Array.isArray(others[entry]) ? others[entry] : [];

  for (let i = assets.length; --i >= 0;) {

    let asset = assets[i];

    if (asset.chunkNames && asset.chunkNames.includes(entry) || asset.auxiliaryChunkNames && asset.auxiliaryChunkNames.includes(entry)) {

      asset = '/assets/' + asset.name;

      if (!asset.endsWith('.css') && !asset.endsWith('.js') && !others[entry].includes(asset)) {
        others[entry].push(asset);
      }
    }
  }

  for (let i = assetsOfEntry.length; --i >= 0;) {

    const asset = '/assets/' + assetsOfEntry[i].name;

    if (asset.endsWith('.css')) {
      css.push(asset);
    }
    else if (asset.endsWith('.js')) {
      js.push(asset);
    }
  }

  res.locals.assets = { css, js, others: others[entry] };

  next();
};
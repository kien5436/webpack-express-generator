/**
 * extract assets from entries to the view,
 * assets available at `res.locals.assets`
 * @param  {string} entry entry name defined in webpack
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

  const assets = webpackStats.assets;
  const css = [];
  const js = [];
  const others = [];

  for (let i = assets.length; --i >= 0;) {

    if (assets[i].chunkNames.includes(entry) || assets[i].auxiliaryChunkNames.includes(entry)) {

      const asset = '/assets/' + assets[i].name;

      if (asset.endsWith('.css')) {
        css.push(asset);
      }
      else if (asset.endsWith('.js')) {
        js.push(asset);
      }
      else {
        others.push(asset);
      }
    }
  }

  res.locals.assets = { css, js, others };

  next();
};
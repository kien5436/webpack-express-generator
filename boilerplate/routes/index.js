const router = require('express').Router();

const { getAssets } = require('../middlewares/asset-manager');

router.get('/', getAssets('index'), (req, res, next) => {

  try {
    const assets = res.locals.assets;

    res.render('index', { ...assets, homepage: 'https://github.com/shhlkien/webpack-express-generator' });
  }
  catch (err) {
    next(err);
  }
});

module.exports = router;
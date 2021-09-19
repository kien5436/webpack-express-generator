import { Router } from 'express';

import getAssets from '../middlewares/extract-assets';

const router = Router();

router.get('/', getAssets('index'), (req, res, next) => {

  try {
    const assets = res.locals.assets;

    res.render('index', { ...assets, homepage: 'https://github.com/shhlkien/webpack-express-generator' });
  }
  catch (err) {
    next(err);
  }
});

export default router;
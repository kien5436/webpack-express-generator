import { merge } from 'webpack-merge';

import sharedConfig from './shared';
import prodConfig from './config.prod';
import devConfig from './config.dev';

export default (env) => {

  switch (env) {
    case 'production':
      return merge(prodConfig, sharedConfig);
    default:
      return merge(devConfig, sharedConfig);
  }
}
const webpack = require('webpack');

/** @type import('webpack').Configuration */
module.exports = {
  mode: 'development',
  optimization: { splitChunks: { chunks: 'all' } },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
  ],
};
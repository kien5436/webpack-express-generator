const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'development',
  plugins: [
    new MiniCssExtractPlugin({ filename: '[name].[contenthash:7].css' }),
  ],
  optimization: { splitChunks: { chunks: 'all' } },
};
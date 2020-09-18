const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const shared = require('./shared')({ babel: '<@ babel @>', style: '<@ style @>' });

module.exports = {
  mode: 'development',
  entry: shared.entry,
  output: shared.output,
  module: shared.module,
  plugins: [
    new MiniCssExtractPlugin({ filename: 'css/[contenthash:7].css' }),
  ],
  optimization: { splitChunks: { chunks: 'all' } },
};
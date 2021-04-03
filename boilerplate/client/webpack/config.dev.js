const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const shared = require('./shared');
const base = {
  mode: 'development',
  plugins: [
    new MiniCssExtractPlugin({ filename: '[contenthash:7].css' }),
  ],
  optimization: { splitChunks: { chunks: 'all' } },
};

module.exports = { ...base, ...shared };
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const shared = require('./shared')({ babel: '<@ babel @>', style: '<@ style @>' });
const base = {
  mode: 'development',
  plugins: [
    new MiniCssExtractPlugin({ filename: 'css/[contenthash:7].css' }),
  ],
  optimization: { splitChunks: { chunks: 'all' } },
};

module.exports = { ...base, ...shared };
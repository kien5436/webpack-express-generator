const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const { entry, output, module: webpackModule } = require('./shared')({ style: '<@ style @>' });

module.exports = {
  mode: 'development',
  entry,
  output,
  module: webpackModule,
  plugins: [
    new MiniCssExtractPlugin({ filename: 'css/[contenthash:7].css' }),
  ],
  optimization: { splitChunks: { chunks: 'all' } },
};
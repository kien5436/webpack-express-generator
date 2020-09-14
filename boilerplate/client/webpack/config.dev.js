const { resolve } = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const srcPath = resolve('client/src');

module.exports = {
  mode: 'development',
  entry: { index: `${srcPath}/scripts/index.js` },
  output: {
    filename: 'js/[contenthash:7].js',
    publicPath: '/assets/',
    path: resolve('client/assets'),
  },
  module: {
    rules: [{
      test: /\.s?[ac]ss$/,
      use: [
        MiniCssExtractPlugin.loader,
        'css-loader',
        'sass-loader',
      ],
    },
    {
      test: /\.(woff2?|ttf|eot|svg)$/,
      use: [{
        loader: 'file-loader',
        options: { name: 'fonts/[name].[ext]' },
      }],
    },
    {
      test: /\.(png|ico|jpe?g)$/,
      use: [{
        loader: 'file-loader',
        options: { name: 'images/[name].[ext]' },
      }],
    },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: 'css/[contenthash:7].css' }),
  ],
  optimization: { splitChunks: { chunks: 'all' } },
};
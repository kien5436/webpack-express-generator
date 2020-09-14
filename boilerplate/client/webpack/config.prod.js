const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { resolve } = require('path');
const ManifestPlugin = require('webpack-manifest-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserJSPlugin = require('terser-webpack-plugin');

const srcPath = resolve('client/src');

module.exports = {
  mode: 'production',
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
    new CleanWebpackPlugin(),
    new ManifestPlugin({
      fileName: __dirname + '/manifest.json',
      generate(seed, files) {

        const manifest = {};

        for (const file of files) {

          const name = file.name.replace(/(\.css|\.js)$/, '');

          manifest[name] = manifest[name] || [];
          manifest[name].push(file.path);
        }

        return manifest;
      },
    }),
    new MiniCssExtractPlugin({ filename: 'css/[contenthash:7].css' }),
  ],
  optimization: {
    splitChunks: { chunks: 'all' },
    minimizer: [
      new TerserJSPlugin({
        cache: true,
        parallel: true,
      }),
      new OptimizeCSSAssetsPlugin(),
    ],
  },
};
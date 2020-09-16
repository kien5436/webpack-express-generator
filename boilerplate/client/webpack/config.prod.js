const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserJSPlugin = require('terser-webpack-plugin');

const { entry, output, module: webpackModule } = require('./shared')({ style: '<@ style @>' });

module.exports = {
  mode: 'production',
  entry,
  output,
  module: webpackModule,
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
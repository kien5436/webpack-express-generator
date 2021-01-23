const { resolve } = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = ({ babel, style }) => {

  const srcPath = resolve('client/src');
  const styleLoader = ['css-loader'];

  switch (style) {
    case 'scss':
    case 'sass':
      styleLoader.push('sass-loader');
      break;
    case 'styl':
      styleLoader.push('stylus-loader');
      break;
    case 'less':
      styleLoader.push('less-loader');
      break;
  }

  const shared = {
    entry: {
      index: `${srcPath}/scripts/index.js`,
    },
    output: {
      filename: '[contenthash:7].js',
      publicPath: '/assets/',
      path: resolve('client/assets'),
    },
    module: {
      rules: [{
          test: /\.(s?[ac]ss|less|styl)$/,
          use: [
            MiniCssExtractPlugin.loader,
            ...styleLoader,
          ],
        },
        {
          test: /\.(woff2?|ttf|eot|svg|png|ico|jpe?g)$/,
          use: [{
            loader: 'file-loader',
            options: { name: '[name].[ext]' },
          }],
        },
      ],
    },
  };

  babel && shared.module.rules.push({
    test: /\.jsx?$/,
    exclude: /node_modules/,
    use: {
      loader: 'babel-loader',
      options: {
        cacheDirectory: true,
      }
    }
  });

  return shared;
}
module.exports = ({ babel, style }) => {

  const styleLoader = ["'css-loader'"];

  switch (style) {
    case 'scss':
    case 'sass':
      styleLoader.push("'sass-loader'");
      break;
    case 'styl':
      styleLoader.push("'stylus-loader'");
      break;
    case 'less':
      styleLoader.push("'less-loader'");
      break;
  }

  return `const { resolve } = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const { NODE_ENV } = require('../../config/env');

const srcPath = resolve('client/src');

module.exports = {
  entry: {
    index: \`\${srcPath}/scripts/index.js\`,
  },
  output: {
    filename: \`\${'production' === NODE_ENV ? '' : '[name].'}[contenthash:7].js\`,
    publicPath: '/assets/',
    path: resolve('client/assets'),
    assetModuleFilename: '[name][ext]',
  },
  module: {
    rules: [{
        test: /\\.(s?[ac]ss|less|styl)$/,
        use: [
          MiniCssExtractPlugin.loader,
          ${styleLoader.join(', ')},
        ],
      },
      {
        test: /\\.(woff2?|ttf|eot|svg|png|ico|jpe?g)$/,
        type: 'asset/resource',
      },
    ${
      babel && `  {
        test: /\\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
          }
        }
      },` || ''
    }
    ],
  },
};`;
}
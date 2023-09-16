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

const { NODE_ENV } = require('../config/env');

const srcPath = resolve('public/src');

/** @type import('webpack').Configuration */
module.exports = {
  entry: {
    index: \`\${srcPath}/index.js\`,
  },
  output: {
    filename: \`\${'production' === NODE_ENV ? '[contenthash:7]' : '[name]'}.js\`,
    publicPath: '/assets/',
    path: resolve('public/assets'),
    assetModuleFilename: \`\${'production' === NODE_ENV ? '[contenthash:7]' : '[name]'}[ext]\`,
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
    ${babel && `  {
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
  plugins: [
    new MiniCssExtractPlugin({ filename: \`\${'production' === NODE_ENV ? '[contenthash:7]' : '[name]'}.css\` }),
  ],
};`;
}
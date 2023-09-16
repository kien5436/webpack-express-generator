import webpack from 'webpack';

/** @type import('webpack').Configuration */
export default {
  mode: 'development',
  optimization: { splitChunks: { chunks: 'all' } },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
  ],
};
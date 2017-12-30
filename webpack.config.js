const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const isDev = process.env.NODE_ENV === 'development';

/**
 * NOTE: No extract text webpack plugin used here
 */

module.exports = {
  devtool: isDev ? 'cheap-module-source-map' : 'source-map',

  cache: true,

  entry: {
    app: ['./client/index.js'],
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[chunkhash:8].js',
    chunkFilename: '[name].[chunkhash:8].chunk.js',
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
        SERVICE_URL: JSON.stringify(process.env.SERVICE_URL || 'http://localhost:3000'),
      },
    }),
    new HtmlWebpackPlugin({
      template: path.resolve('./client/index.html'),
    }),
  ],

  module: {
    rules: [
      {
        test: /\.js$/,
        include: /client/,
        loader: 'babel-loader',
        options: {
          babelrc: false,
          presets: [require.resolve('babel-preset-react-app')],
          cacheDirectory: true,
        },
      },
      {
        test: /\.css$/,
        loader: ['style-loader', 'css-loader'],
      },
    ],
  },
};

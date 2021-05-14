const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: {
    main: './src/main.js'
  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.js'
    }
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        // exclude: /node_modules/,
        exclude: /node_modules\/core-js/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  optimization: {
    minimizer: [new TerserPlugin({ extractComments: false })],
  }
}

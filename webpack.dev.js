const path = require('path');

const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
module.exports = merge(common, {
  mode: 'development',
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    hot: false,
    inline: false,
    port: 9999
  }
});
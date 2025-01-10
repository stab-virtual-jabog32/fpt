const { environment } = require('@rails/webpacker');
const webpack = require('webpack');

// Add Node.js polyfills for Webpack 5
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
environment.plugins.append('NodePolyfillPlugin', new NodePolyfillPlugin());

environment.plugins.append('Provide', new webpack.ProvidePlugin({
  $: 'jquery',
  jQuery: 'jquery',
  Popper: ['popper.js', 'default']
}));

module.exports = environment;


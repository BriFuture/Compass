var path = require('path');

module.exports = {
  entry: "./src/compass/SpacePath.js",
  // chainWebpack: config => {
  //     config.module.rules.delete('eslint');
  // },
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options:{
          presets:["@babel/preset-env"]
        },
        exclude:[/node_modules/, /assets/],

      },
    ]
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'spacepath.js'
  },
  optimization: {
    minimize: false
  }
}
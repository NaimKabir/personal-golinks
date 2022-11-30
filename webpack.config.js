const path = require('path')

module.exports = {
  context: path.resolve(__dirname, 'popup'),
  entry: './src/popup.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'popup/dist')
  },
  devServer: {
    static: path.resolve(__dirname, 'popup/dist'),
    port: 8080,
    hot: true
  }
}

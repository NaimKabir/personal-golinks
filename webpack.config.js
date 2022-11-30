const path = require('path')

module.exports = {
	watch: true,
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
	},
	module: {
	    rules: [
	      {
	        test: /\.(scss)$/,
	        use: [
	          {
	            loader: 'style-loader'
	          },
	          {
	            loader: 'css-loader'
	          },
	          {
	            loader: 'postcss-loader',
	            options: {
	              postcssOptions: {
	                plugins: () => [
	                  require('autoprefixer')
	                ]
	              }
	            }
	          },
	          {
	            loader: 'sass-loader'
	          }
	        ]
	      }
	    ]
	}
}

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');

// Use environment variable for output directory, defaulting to 'dist'
const outputDirectory = process.env.WEBPACK_OUTPUT_DIR || 'dist';

module.exports = {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'awesome-typescript-loader'
          },
        ],
        exclude: /node_modules/
      },
      {
        enforce: 'pre',
        test: /\.js$/,
        loader: 'source-map-loader'
      },
      {
        test: /\.less$/,
        use: [
          { loader: 'style-loader' },
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: './Less',
              hmr: process.env.NODE_ENV === 'development',
            },
          },
          { loader: 'css-loader' },
          {
            loader: 'less-loader',
            options: {
              strictMath: true,
              noIeCompat: true,
            }
          },
        ]
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/,
        loader: 'url-loader?limit=100000'
      },
    ]
  },
  resolve: {
    extensions: ['*', '.ts', '.tsx', '.js', '.jsx', '.json', '.less']
  },
  devServer: {
    port: process.env.PORT || 3000,
    open: true,
    hot: true,
    proxy: {
      '/api/**': {
        target: process.env.API_TARGET || 'http://localhost:8050',
        secure: false,
        changeOrigin: true
      }
    }
  },
  plugins: [
    new CleanWebpackPlugin([outputDirectory]),
    new HtmlWebpackPlugin({
      template: process.env.HTML_TEMPLATE_PATH || './public/index.html',
      favicon: process.env.HTML_FAVICON_PATH || './public/favicon.ico',
      title: 'express-typescript-react',
    }),
    new MiniCssExtractPlugin({
      filename: './css/[name].css',
      chunkFilename: './css/[id].css',
    }),
    new CopyPlugin([
      { from: process.env.ASSETS_SRC_PATH || './src/client/Assets', to: 'assets' },
    ])
  ],
};

// Use Node.js built-in path module with __dirname-anchored resolution for cloud environments
// For Azure deployments, module paths are resolved relative to __dirname for environment-agnostic loading
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

// Use environment variable for output directory to support cloud deployments
// In Azure, this can point to a mounted volume or Azure Blob Storage path
// Configuration can be managed via Azure App Configuration service
const outputDirectory = process.env.WEBPACK_OUTPUT_DIR || 'dist';

module.exports = (env, argv) => {
  const mode = argv.mode || 'development';
  const isProductionBuild = mode === 'production';

  return {
    entry: ['babel-polyfill', './src/client/index.tsx'],
    output: {
      // Use __dirname-anchored path.resolve() for environment-agnostic path resolution
      // This ensures compatibility with containerized environments and Azure App Service
      path: path.resolve(__dirname, outputDirectory),
      filename: './js/[name].bundle.js',
      publicPath: process.env.PUBLIC_PATH || '/'
    },
    devtool: 'source-map',
    optimization: {
      // Enable minification only for production builds to optimize Azure CDN delivery
      minimize: isProductionBuild,
      minimizer: [
        '...',
        // CSS minification for production builds to reduce bandwidth costs
        // Optimized for Azure Front Door CDN delivery and Azure Blob Storage
        new CssMinimizerPlugin({
          minimizerOptions: {
            preset: ['default', { discardComments: { removeAll: true } }],
          },
        }),
      ],
    },
    module: {
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
              loader: 'awesome-typescript-loader',
              options: {
                // Use client-specific tsconfig for browser code compilation
                // This ensures DOM types are available and server types are excluded
                configFileName: 'tsconfig.client.json'
              }
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
                hmr: !isProductionBuild,
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
      port: process.env.DEV_SERVER_PORT || 3000,
      open: true,
      hot: true,
      proxy: {
        '/api/**': {
          target: process.env.API_PROXY_TARGET || 'http://localhost:8050',
          secure: false,
          changeOrigin: true
        }
      }
    },
    plugins: [
      new CleanWebpackPlugin([outputDirectory]),
      new HtmlWebpackPlugin({
        inject: 'body',
        template: './public/index.html',
        favicon: './public/favicon.ico',
        title: 'express-typescript-react',
      }),
      new MiniCssExtractPlugin({
        filename: './css/[name].css',
        chunkFilename: './css/[id].css',
      }),
      new CopyPlugin([
        { from: './src/client/Assets', to: 'assets' },
      ])
    ],
  };
};

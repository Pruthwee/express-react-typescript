const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const S3Plugin = require('webpack-s3-plugin');

// Cloud-ready path resolution using environment variables
// These can be populated from AWS Systems Manager Parameter Store
// Example: AWS_BUILD_OUTPUT_DIR can be fetched from Parameter Store at build time
const outputDirectory = process.env.BUILD_OUTPUT_DIR || process.env.AWS_BUILD_OUTPUT_DIR || 'dist';

// Base path resolution - use process.cwd() instead of __dirname for container compatibility
// In AWS environments (ECS, Lambda, etc.), working directory is configurable
const basePath = process.env.APP_BASE_PATH || process.cwd();

module.exports = {
  entry: ['babel-polyfill', './src/client/index.tsx'],
  output: {
    // Use environment-variable-driven path resolution for cloud deployments
    // Supports AWS Parameter Store configuration via environment variables
    path: path.resolve(basePath, outputDirectory),
    filename: './js/[name].bundle.js',
    // Configure public path to use CloudFront or S3 bucket URL in production
    // Can be set from AWS Parameter Store: /app/config/cdn-url
    publicPath: process.env.AWS_CDN_PUBLIC_PATH || process.env.AWS_S3_PUBLIC_PATH || '/'
  },
  // Enable optimization for production builds
  optimization: {
    minimize: true,
    minimizer: [
      // Use '...' to extend existing minimizers (terser-webpack-plugin, etc.)
      '...',
      // Add CSS minification using CssMinimizerPlugin with cssnano
      // This reduces CSS file size for faster CloudFront CDN delivery
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: ['default', { discardComments: { removeAll: true } }],
        },
      }),
    ],
  },
  devtool: 'source-map',
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
    // Use environment variable for dev server port (AWS Parameter Store: /app/config/dev-port)
    port: process.env.DEV_SERVER_PORT || 3000,
    open: true,
    hot: true,
    proxy: {
      '/api/**': {
        // Backend API URL from environment variable (AWS Parameter Store: /app/config/api-url)
        target: process.env.API_BACKEND_URL || 'http://localhost:8050',
        secure: false,
        changeOrigin: true
      }
    }
  },
  plugins: [
    new CleanWebpackPlugin([outputDirectory]),
    new HtmlWebpackPlugin({
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
    ]),
    // AWS S3 Plugin for uploading build artifacts to S3 in production
    // Configuration loaded from environment variables (can be populated from AWS Parameter Store)
    // Example Parameter Store keys:
    //   /app/config/s3-bucket
    //   /app/config/s3-region
    //   /app/config/s3-base-path
    ...(process.env.AWS_S3_BUCKET ? [
      new S3Plugin({
        s3Options: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          region: process.env.AWS_REGION || 'us-east-1',
        },
        s3UploadOptions: {
          Bucket: process.env.AWS_S3_BUCKET,
          CacheControl: 'max-age=31536000',
        },
        directory: outputDirectory,
        basePath: process.env.AWS_S3_BASE_PATH || 'assets',
      })
    ] : [])
  ],
};

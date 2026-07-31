## Dependency Management and AWS CodeArtifact

This application follows cloud-native best practices for dependency management:

### Key Principles

- **Never commit `node_modules/`**: The `node_modules` directory is excluded from version control via `.gitignore`
- **Use lock files**: `yarn.lock` (or `package-lock.json`) ensures reproducible builds across all environments
- **CI/CD integration**: AWS CodeBuild uses `buildspec.yml` to install dependencies from lock files

### AWS CodeBuild Integration

The included `buildspec.yml` configures AWS CodeBuild to:
1. Install dependencies using `yarn install --frozen-lockfile` or `npm ci`
2. Build the application with production optimizations
3. Cache `node_modules` for faster subsequent builds
4. Exclude `node_modules` from deployment artifacts

### AWS CodeArtifact (Optional)

For private package management, this application can be configured to use AWS CodeArtifact as a private npm registry. See [AWS_CODEARTIFACT_SETUP.md](./AWS_CODEARTIFACT_SETUP.md) for detailed setup instructions.

---

CSS minification is automatically enabled in production builds using:
- **LESS Compilation**: LESS files are compiled to CSS and then minified in the production build
To build with CSS minification enabled:

```bash
# Next.js build (recommended for AWS Lambda/Amplify)
NODE_ENV=production npm run build

# Legacy webpack build
The included `buildspec.yml` file configures AWS CodeBuild/CodePipeline to:
4. Deploy minified CSS to S3 bucket
5. Invalidate CloudFront cache for updated assets

#### Required Environment Variables for CodePipeline

Configure these environment variables in your AWS CodeBuild project:

- `NODE_ENV`: Set to `production` (enables CSS minification)
- `S3_BUCKET`: Target S3 bucket for static assets (e.g., `my-app-static-assets`)
- `CLOUDFRONT_DISTRIBUTION_ID`: CloudFront distribution ID for cache invalidation (optional)
- `AWS_REGION`: AWS region for S3 and CloudFront operations (default: `us-east-1`)

#### CodePipeline Setup

1. **Source Stage**: Connect to your Git repository (CodeCommit, GitHub, etc.)
2. **Build Stage**: Use AWS CodeBuild with the included `buildspec.yml`
3. **Deploy Stage**: Artifacts are automatically deployed to S3 during the build stage

The build process ensures:
- LESS files (`src/client/Less/app.less`) are compiled to CSS
- CSS is minified using CSSNano with aggressive optimization presets
- Minified CSS is deployed to S3 with cache-control headers
- CloudFront cache is invalidated for immediate delivery
- Optimized for global edge network delivery with long-term caching
- Cached at edge locations for reduced latency

#### Cache Headers

Static assets are deployed with the following cache-control headers:
- **CSS/JS bundles**: `public,max-age=31536000,immutable` (1 year, immutable)
- **Public assets**: `public,max-age=86400` (1 day)

These headers ensure optimal CloudFront caching and reduced bandwidth costs.
- Optimized for global edge network delivery

### Verification

Check that CSS files are minified by inspecting the build output in `.next/static/css/` or `dist/css/` directories.

  - [Quick Start](#quick-start)
  - [Documentation](#documentation)
    - [Directory Structure](#directory-structure)
    - [Babel](#babel)
    - [Typescript](#typescript)
    - [Less](#less)
    - [ESLint](#eslint)
    - [Webpack](#webpack)
    - [Webpack dev server](#webpack-dev-server)
    - [AWS S3 Configuration](#aws-s3-configuration)
## Introduction

It's a really well-configured approach for building applications with full-stack Typescript. It's configured for Back-end development with using MongoDB as Database, ExpressJS framework for web services and Front-end development using ReactJS library with help of Typescript language and Less preprocessor for stylesheets.

## prerequisite

-First make sure that you have a MongoDB database installed somewhere and change the configurations in `src/server/configs.ts` file. the default is localhost.

### Development mode

In the development mode, you will have a back-end server running with [nodemon](https://nodemon.io/) and a Front-end server running with the [webpack dev server](https://webpack.js.org/configuration/dev-server/). The [webpack dev server](https://webpack.js.org/configuration/dev-server/) which helps with hot and live reloading for Front-end. The server-side Express code will be served by a node server using [nodemon](https://nodemon.io/) which helps in automatically restarting the server whenever server-side code changes.

### Production mode

In the production mode, you will have only the Back-end code in server directory. Webpack will load Typescript and Less into separate directories for JavaScript and CSS bundles.
Separating JavaScript from CSS helps browsers for caching CSS files.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/Fractalliter/express-react-typescript <app-name>

#Attention please: change the <app-name> with your prefered name for your app

# Go inside the directory
cd <app-name>

# Install dependencies
yarn (or npm install)

# Start development server
yarn dev (or npm run dev)

# Build for production
yarn build (or npm run build)

# Start production server
yarn start (or npm start)
```

If you are looking for typeless and pure css you can find it [here](https://github.com/crsandeep/simple-react-full-stack)
 
## Documentation

### Directory Structure

Source code for Back-end and Front-end will be placed at src directory. Server directory is for web services and Client is for UI source codes in development mood. For production mood, Webpack bundles everything inside the client directory and all the assets files at assets into the dist directory.

### Typescript

[Typescript](https://www.typescriptlang.org) is a typed superset for Javascript that compiles to plain JavaScript. It's only for preventing miss-typing in development mood. In production mood it's just plain JavaScript.

### Less

[Less](http://lesscss.org/) is a backwards-compatible language extension for CSS. Less helps to write CSS in a functional way and It's really easy to read and understand.

### ESLint

[ESLint](https://eslint.org/) is a pluggable and configurable linter tool for identifying and reporting on patterns in JavaScript and Typescript.

[.eslintrc.json file](<(https://eslint.org/docs/user-guide/configuring)>) (alternatively configurations can be written in Javascript or YAML as well) is used describe the configurations required for ESLint. Below is the .eslintrc.json file which has been used.

```javascript
{
  "extends": ["airbnb"],
  "env": {
    "browser": true,
    "node": true
  },
  "rules": {
    "no-console": "off",
    "comma-dangle": "off",
    "react/jsx-filename-extension": "off"
  }
}
```

[Airbnb's Javascript Style Guide](https://github.com/airbnb/javascript) which has been used by the majority of JavaScript and Typescript developers worldwide. Since the aim is support for both client (browser) and server side (Node.js) source code, the **env** has been set to browser and node. 
Optionally, you can override the current settings by installing `eslint` globally and running `eslint --init` to change the configurations to suit your needs. [**no-console**](https://eslint.org/docs/rules/no-console), [**comma-dangle**](https://eslint.org/docs/rules/comma-dangle) and [**react/jsx-filename-extension**](https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-filename-extension.md) rules have been turned off.

### Webpack

[Webpack](https://webpack.js.org/) is a module bundler. Its main purpose is to capable Front-end developers to experience a modular programming style and bundle JavaScript and CSS files for usage in a browser.

[webpack.config.js](https://webpack.js.org/configuration/) file has been used to describe the configurations required for webpack. Below is the webpack.config.js file which has been used.

```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const outputDirectory = 'dist';

module.exports = {
  entry: ['babel-polyfill', './src/client/index.tsx'],
  output: {
    path: path.join(__dirname, outputDirectory),
    filename: './js/[name].bundle.js'
  },
  devtool: "source-map",
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
        use:[
          {
            loader: "awesome-typescript-loader"
          },
        ],
        exclude: /node_modules/
      },
      {
        enforce: "pre",
        test: /\.js$/,
        loader: "source-map-loader"
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
    port: 3000,
    open: true,
    proxy: {
      '/api': 'http://localhost:8050'
    }
  },
  plugins: [
    new CleanWebpackPlugin([outputDirectory]),
    new HtmlWebpackPlugin({
      template: './public/index.html',
      favicon: './public/favicon.ico',
      title: "Book Manager",
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

```

1.  **entry:** entry: ./src/client/index.tsx is where the application starts executing and Webpack starts bundling.
    Note: babel-polyfill is added to support async/await. Read more [here](https://babeljs.io/docs/en/babel-polyfill#usage-in-node-browserify-webpack).
2.  **output path and filename:** the target directory and the filename for the bundled output.
3.  **module loaders:** Module loaders are transformations that are applied on the source code of a module. We pass all the js file through [babel-loader](https://github.com/babel/babel-loader) to transform JSX to Javascript. CSS files are passed through [css-loaders](https://github.com/webpack-contrib/css-loader) and [style-loaders](https://github.com/webpack-contrib/style-loader) to load and bundle CSS files. Fonts and images are loaded through url-loader.
4.  **Dev Server:** Configurations for the webpack-dev-server which will be described in coming section.
5.  **plugins:** [clean-webpack-plugin](https://github.com/johnagan/clean-webpack-plugin) is a webpack plugin to remove the build directory before building. [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin) simplifies creation of HTML files to serve your webpack bundles. It loads the template (public/index.html) and injects the output bundle.

### Webpack dev server

[Webpack dev server](https://webpack.js.org/configuration/dev-server/) is used along with webpack. It provides a development server that enables live reloading for the client side code changes.

The devServer section of webpack.config.js contains the configuration required to run webpack-dev-server which is given below.

```javascript
devServer: {
    port: 3000,
    open: true,
    proxy: {
        "/api": "http://localhost:8050"
    }
}
```

[**Port**](https://webpack.js.org/configuration/dev-server/#devserver-port) specifies the Webpack dev server to listen on this particular port (3000 in this case). When [**open**](https://webpack.js.org/configuration/dev-server/#devserver-open) is set to true, it will automatically open the home page on start-up. [Proxying](https://webpack.js.org/configuration/dev-server/#devserver-proxy) URLs can be useful when you have a separate API backend development server, and you want to send API requests on the same domain.

### Nodemon

Nodemon is a utility monitors for any changes in the server-side source code, and automatically restarts the server. Nodemon is just for development purposes only.
**nodemon.json** file is used to hold the configurations for Nodemon.

### Express

Express is a web application framework for Node.js. It is used to build our backend API's.

**src/server/index.ts** is the entry point to the server application which starts a server and listens on port 8085 for connections. The app responds with `{username: <username>}` for requests to the URL (/api/test). It is also configured to serve the static files from **dist** directory.

### Concurrently

[Concurrently](https://github.com/kimmobrunfeldt/concurrently) is used to run multiple commands concurrently. I's been used to run the webpack dev server and the backend node server concurrently in the development environment. Below are the npm/yarn script commands used.

```javascript
"scripts": {
    "build": "webpack --mode production",
    "start": "npm run build && npm run server",
    "client": "webpack-dev-server --mode development --devtool inline-source-map --hot",
    "server": "tsc -p tsconfig.server.json && node server/",
    "dev": "concurrently \"nodemon\" \"npm run client\"",
    "server-dev": "nodemon"
  },
```

### VSCode + ESLint + Prettier

[VSCode](https://code.visualstudio.com/) is a lightweight but powerful source code editor. [ESLint](https://eslint.org/) takes care of the code-quality. [Prettier](https://prettier.io/) takes care of all the formatting.

#### Installation guide

1.  Install [VSCode](https://code.visualstudio.com/)
2.  Install [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
3.  Install [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
4.  Modify the VSCode user settings to add below configuration

    ```javascript
    "eslint.alwaysShowStatus": true,
    "eslint.autoFixOnSave": true,
    "editor.formatOnSave": true,
    "prettier.eslintIntegration": true
    ```

This can be configured at the project level by following [this article](https://medium.com/@netczuk/your-last-eslint-config-9e35bace2f99).

### AWS S3 Configuration

This application is configured to deploy static assets (JavaScript bundles, CSS files, images) to AWS S3 for cloud-native storage and delivery. This ensures compatibility with containerized and serverless environments where local file system storage is ephemeral.

#### Environment Variables

To enable S3 integration during the build process, configure the following environment variables:

**Required for S3 Upload:**
- `AWS_S3_BUCKET`: The name of your S3 bucket (e.g., `my-app-assets`)
- `AWS_ACCESS_KEY_ID`: Your AWS access key ID
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret access key
- `AWS_REGION`: AWS region where your bucket is located (default: `us-east-1`)

**Optional Configuration:**
- `AWS_S3_BASE_PATH`: Base path within the S3 bucket (default: `assets`)
- `AWS_S3_PUBLIC_PATH`: Public URL path for accessing assets (e.g., `https://cdn.example.com/`)
- `BUILD_OUTPUT_DIR`: Local build output directory (default: `dist`)

#### Development Mode

In development mode, assets are served locally from the webpack dev server. No S3 configuration is required:

```bash
npm run dev
```

#### Production Build with S3 Upload

When building for production with S3 upload enabled:

```bash
# Set environment variables
export AWS_S3_BUCKET=my-app-assets
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_REGION=us-east-1
export AWS_S3_PUBLIC_PATH=https://my-app-assets.s3.amazonaws.com/

# Build and upload to S3
npm run build
```

#### S3 Bucket Configuration

Ensure your S3 bucket is configured with:
- Public read access for static assets (or use CloudFront for CDN)
- CORS configuration if serving assets from a different domain
- Appropriate bucket policies for the IAM user credentials

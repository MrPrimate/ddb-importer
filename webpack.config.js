const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  mode: 'production',
  devtool: "source-map",
  resolve: {
    extensions: ['.ts', '.mjs', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  entry: {
    main: {
      import: './src/index.ts',
      // dependOn: ['lib', 'lowdash', 'parserLib', 'enrichers', 'effects'],
    },
    // enrichers: {
    //   import: './src/parser/enrichers/_module.mjs',
    //   dependOn: ['main', 'lib', 'effects', 'parserLib'],
    // },
    // effects: {
    //   import: './src/parser/enrichers/effects/_module.mjs',
    //   dependOn: ['main', 'lib'],
    // },
    // lib: {
    //   import: './src/parser/enrichers/_module.mjs',
    //   dependOn: ['lowdash'],
    // },
    // parserLib: {
    //   import: './src/parser/lib/_module.mjs',
    //   dependOn: ['lowdash'],
    // },
    // lowdash: {
    //   import: './vendor/lowdash/_module.js',
    // },
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_classnames: true,
          keep_fnames: true,
          format: {
            comments: false,
          },
        },
        extractComments: true,
      }),
    ],
    // runtimeChunk: 'single',
    // splitChunks: {
    //   chunks: 'all',
    // },
  },
  output: {
    filename: '[name].mjs',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    // The module ships as a single ES module. A dynamic import() without the
    // `webpackMode: "eager"` hint would otherwise become a separate chunk whose
    // loader cannot find its public path from an ES module script, so it would
    // fail only in release builds (the esbuild dev build inlines everything).
    new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
  ],
};


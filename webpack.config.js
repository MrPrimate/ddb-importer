const path = require('path');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  mode: 'production',
  devtool: "source-map",
  entry: {
    main: {
      import: './src/index.mjs',
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
};


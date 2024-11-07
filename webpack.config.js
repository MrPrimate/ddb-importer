const path = require('path');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  mode: 'production',
  devtool: "source-map",
  entry: {
    main: {
      import: './src/index.js',
      dependOn: ['lowdash', 'parseTable'],
    },
    // enrichers: {
    //   import: './src/parser/enrichers/_module.mjs',
    //   dependOn: ['main'],
    // },
    lowdash: {
      import: './vendor/lowdash/_module.js',
    },
    parseTable: {
      import: './vendor/parseTable.js',
      dependOn: ['lowdash'],
    },
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
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
};


const path = require('path');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  devtool: "source-map",
  entry: {
    main: {
      import: './src/index.js',
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
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
};


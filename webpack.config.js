const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: path.resolve(__dirname, 'src/index.ts'),
  mode: 'production',
  target: 'node',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js'
  },
  resolve: {
    extensions: ['.ts', '.js', '.json'],
  },
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          'ts-loader',
        ]
      }
    ]
  }
};

/* eslint-disable @typescript-eslint/no-var-requires */
const nodeExternals = require('webpack-node-externals');
const { RunScriptWebpackPlugin } = require('run-script-webpack-plugin');
const { PnpWebpackPlugin } = require('pnp-webpack-plugin');

module.exports = function (options, webpack) {
  return {
    ...options,
    entry: ['webpack/hot/poll?100', options.entry],
    externals: [
      nodeExternals({
        allowlist: ['webpack/hot/poll?100'],
        modulesDir: '../../node_modules',
      }),
    ],
    resolve: {
      ...options.resolve,
      plugins: [
        ...(options.resolve?.plugins || []),
        PnpWebpackPlugin,
      ],
    },
    resolveLoader: {
      ...options.resolveLoader,
      plugins: [
        ...(options.resolveLoader?.plugins || []),
        PnpWebpackPlugin.moduleLoader(module),
      ],
    },
    plugins: [
      ...options.plugins,
      new webpack.HotModuleReplacementPlugin(),
      new webpack.WatchIgnorePlugin({
        paths: [/\.js$/, /\.d\.ts$/],
      }),
      new RunScriptWebpackPlugin({ name: options.output.filename }),
    ],
  };
};

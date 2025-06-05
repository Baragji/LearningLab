/* eslint-disable @typescript-eslint/no-var-requires */
const nodeExternals = require('webpack-node-externals');
const { RunScriptWebpackPlugin } = require('run-script-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

// Eksporter en funktion med den korrekte signatur som NestJS CLI forventer
module.exports = function (options, webpackInstance) {
  return {
    ...options,
    entry: ['webpack/hot/poll?100', options.entry],
    externals: [
      nodeExternals({
        allowlist: ['webpack/hot/poll?100'],
        modulesDir: path.resolve(__dirname, '../../node_modules'),
      }),
    ],
    plugins: [
      ...options.plugins,
      new webpackInstance.HotModuleReplacementPlugin(),
      new webpackInstance.WatchIgnorePlugin({
        paths: [/\.js$/, /\.d\.ts$/],
      }),
      new RunScriptWebpackPlugin({ name: options.output.filename }),
    ],
    resolve: {
      ...options.resolve,
      alias: {
        ...options.resolve?.alias,
        rxjs: path.resolve(__dirname, '../../node_modules/rxjs'),
      },
    },
    module: {
      ...options.module,
      rules: [
        ...(options.module?.rules || []),
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              configFile: path.resolve(__dirname, 'tsconfig.build.json'),
            },
          },
        },
      ],
    },
  };
};

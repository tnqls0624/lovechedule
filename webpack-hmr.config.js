// webpack-hmr.config.js
const nodeExternals = require('webpack-node-externals');
const { RunScriptWebpackPlugin } = require('run-script-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = function (options, webpack) {
  options.module.rules.forEach((rule) => {
    rule.use?.forEach((use) => {
      if (use.loader === 'ts-loader') {
        use.loader = 'swc-loader';
        delete use.options;
      }
    });
  });

  options.plugins = options.plugins.filter(
    (plugin) => !(plugin instanceof ForkTsCheckerWebpackPlugin),
  );

  return {
    ...options,
    entry: ['webpack/hot/poll?100', options.entry],
    externals: [
      nodeExternals({
        allowlist: ['webpack/hot/poll?100'],
      }),
    ],
    plugins: [
      ...options.plugins,
      new webpack.HotModuleReplacementPlugin(),
      new webpack.WatchIgnorePlugin({
        paths: [/\.js$/, /\.d\.ts$/],
      }),
      new RunScriptWebpackPlugin({ name: options.output.filename }),
    ],
    devtool: 'source-map',
  };
};

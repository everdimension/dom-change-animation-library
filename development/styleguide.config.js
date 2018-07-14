module.exports = {
  components: 'src/components/**/[A-Z]*.js',
  getComponentPathLine() {
    return '';
  },
  webpackConfig: {
    module: {
      rules: [
        // Babel loader, will use your project’s .babelrc
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          include: [/src/, '../src'],
          loader: 'babel-loader',
        },
      ],
    },
  },
};

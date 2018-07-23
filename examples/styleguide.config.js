module.exports = {
  title: 'List Transitions',
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
        {
          test: /\.css$/,
          exclude: /node_modules/,
          include: /src/,
          use: [
            { loader: 'style-loader' },
            {
              loader: 'css-loader',
              options: {
                modules: true,
                localIdentName: '[path][name]__[local]--[hash:base64:5]',
              },
            },
          ],
        },
      ],
    },
  },
  styles: {
    Playground: {
      preview: {
        paddingLeft: 0,
        paddingRight: 0,
        borderWidth: [[0, 0, 1, 0]],
        borderRadius: 0,
      },
    },
    // Markdown: {
    //   pre: {
    //     border: 0,
    //     background: 'none',
    //   },
    //   code: {
    //     fontSize: 14,
    //   },
    // },
  },
};

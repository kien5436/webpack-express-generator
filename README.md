# Webpack express generator
Webpack good practice for Express project

## Build status
[![npm]][npm-url]
![npm](https://img.shields.io/npm/dw/webpack-express-generator?style=flat-square)
![Build status](https://img.shields.io/badge/build-passing-success?style=flat-square)

## Why good but not best?
Nothing is perfect, including this package. It only offers "good" options for the most common cases while developing with Webpack

## Installation
```
npm i -g webpack-express-generator
# or
yarn global add webpack-express-generator
```

## How to use?
Quick generate your app:
```
we your-app
```
Run the app:
```
npm start
# or
yarn start
```

Other options:
```
Usage: we <project-name> [options]

Options:
  -v, --version      output the version number
  --eslint <rule>    eslint config support:
                     recommended: eslint recommendation,
                     pk: my recommendation for eslint
  --style <type>     stylesheet support (css|sass|scss|less|styl) (default: "css")
  --view <engine>    view engine support (pug|ejs|hbs) (default: "pug")
  --babel            babel support
  -f, --force        force on non-empty directory
  -h, --help         display help for command
```

## Additional infomations
- To use "JSON with comments", change `Language Mode` of file to `JSONC` or remove comments if your editor doesn't support this
- To avoid polluting server's console, I set `webpack-dev-middleware` to log only if there is any error or warning. To see what `webpack` does, change `stats` to `normal`
```js
webpackDevMiddleware(compiler, {
  publicPath: config.output.publicPath,
  serverSideRender: true,
  stats: 'normal', // change it
  writeToDisk: false,
})
```
- To get the assets corresponding to the view, pass the entry name defined in webpack to `getAssets` middleware.
```js
router.get('/', getAssets('asset'), (req, res, next) => {

  const assets = res.locals.assets;
  // do other things
})
```
- Tip: `webpack-dev-middleware` will suspend all requests until the building progress is finished. To ignore requests which don't require any asset, you may follow below instruction:
```js
const webpackBuilder = require('../middlewares/webpack-builder');

app.use('/api', apiRoutes);
// use webpackBuilder at a seperate path
app.use('/', webpackBuilder, otherRoutes);
```

## License
[MIT](LICENSE)

[npm]: https://img.shields.io/npm/v/webpack-express-generator?style=flat-square
[npm-url]: https://www.npmjs.com/package/webpack-express-generator

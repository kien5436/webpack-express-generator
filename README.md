# Webpack express generator
Webpack good practice for Express project

## Build status
![npm](https://img.shields.io/npm/v/webpack-express-generator?style=flat-square)
![npm](https://img.shields.io/npm/dm/webpack-express-generator?style=flat-square)
[![Build Status](https://img.shields.io/badge/build-developing-blue.svg)]()

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
Install dependencies and run the app:
```
npm i && npm run build && npm start
# or
yarn && yarn build && yarn start
```

Other options:
```
Usage: we <project-name> [options]

<project-name> can be relative or absolute path

Options:
  -v, --version    output the version number
  --view <engine>  view engine support (pug|ejs|hbs) (default: "pug")
  --eslint <rule>  eslint config support:
                   recommended: eslint recommendation,
                   pk: my recommendation for eslint (default: "recommended")
  -f, --force      force on non-empty directory
  -h, --help       display help for command
```

## Additional infomations
- To avoid polluting server's console, I set `webpack-dev-middleware` to log only if there is any error or warning. To see what `webpack` does, change `stats` to `normal`
```js
webpackDevMiddleware(compiler, {
  publicPath: config.output.publicPath,
  serverSideRender: true,
  stats: 'normal', // change it
  writeToDisk: false,
})
```

## License
[MIT](LICENSE)
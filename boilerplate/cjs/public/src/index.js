import './favicon.ico';
import './index.<@ style @>';

// include this condition in every entry file to enable hot reload
if (module.hot) {
  module.hot.accept();
}

console.info('webpack-express-generator');
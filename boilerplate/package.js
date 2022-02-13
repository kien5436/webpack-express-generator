module.exports = (name, moduleType) => {

  const info = {
    name,
    'version': '1.0.0',
    'description': '',
    'main': 'index.js',
    'scripts': {
      'dev': `cross-env NODE_ENV=development nodemon${'mjs' === moduleType ? ' --experimental-specifier-resolution=node' : ''} index.js`,
      'start': `cross-env NODE_ENV=production node${'mjs' === moduleType ? ' --experimental-specifier-resolution=node' : ''} index.js`,
    },
    'nodemonConfig': {
      'ignore': [
        'node_modules/',
        'public/',
      ],
    },
    browserslist: [
      'defaults'
    ],
  };

  if ('mjs' === moduleType) info.type = 'module';

  return info;
};
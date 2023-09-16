module.exports = {
  'compact': true,
  'minified': true,
  'only': ['./public/src/**'],
  // Plugin ordering is first to last
  'plugins': [
    [
      '@babel/plugin-transform-runtime', {
        'absoluteRuntime': true,
        'corejs': 3,
        'helpers': false,
        'regenerator': false,
        'version': '^7.11.0',
      },
    ],
  ],
  // Preset ordering is last to first
  'presets': [
    '@babel/preset-env',
  ],
};
const { promises: { readdir } } = require('fs');
const { join, resolve } = require('path');

const BOILERPLATE_DIR = join(__dirname, '../boilerplate');

module.exports = async (moduleType) => {

  try {
    const dirents = await readDir(`${BOILERPLATE_DIR}/${moduleType}`, 1);
    const files = [];

    for await (const file of dirents)
      files.push({ ...file, name: file.name.replace(moduleType + '/', '') });

    return files.sort((f1, f2) => f2.level - f1.level);
  }
  catch (err) {
    console.error(err);
  }
};

/**
 * @param {string} dir
 * @param {number} level
 * @returns {{isDir: boolean, level: number, name: string}[]}
 */
async function* readDir(dir, level) {

  const files = await readdir(dir, { withFileTypes: true });
  const excludeFiles = ['app.js', 'eslint.js', 'package.js', 'shared.js'];
  const excludeExtensions = ['.ejs', '.pug', '.hbs', '.css', '.sass', '.scss', '.less', '.styl'];

  for (const file of files) {

    if (excludeFiles.includes(file.name) || excludeExtensions.some((ext) => file.name.endsWith(ext))) continue;

    const realPath = resolve(dir, file.name);

    if (file.isDirectory())
      yield* readDir(realPath, level + 1);

    yield {
      isDir: file.isDirectory(),
      level,
      name: realPath.replace(BOILERPLATE_DIR, '').replace(/\\/g, '/'),
    };
  }
}
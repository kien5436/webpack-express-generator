#!/usr/bin/env node

const { basename, isAbsolute, join, resolve } = require('path');
const { constants: { F_OK }, promises: { access, copyFile, mkdir, opendir, readdir, readFile, rmdir, writeFile } } = require('fs');
const { createInterface } = require('readline');
const { exec, execSync } = require('child_process');
const { program } = require('commander');
const { Spinner } = require('cli-spinner');

const collectFileMap = require('./structure-generator');
const { version: VERSION } = require('../package.json');
const BOILERPLATE_DIR = join(__dirname, '../boilerplate');
const MODE_RW = parseInt('0666', 8);
const MODE_RWX = parseInt('0755', 8);

program
  .name('we-create')
  .version(VERSION, '-v, --version')
  .usage('<project-name> [options]')
  .arguments('<project-name>')
  .option('--eslint <rule>', `eslint config support:
                   recommended: eslint recommendation,
                   pk: my recommendation for eslint`, setLinter)
  .option('--style <type>', 'stylesheet support (css|sass|scss|less|styl)', setStyle, 'css')
  .option('--view <engine>', 'view engine support (pug|ejs|hbs)', setViewEngine, 'pug')
  .option('--resolver <type>', 'node module resolver (commonjs|module)', setNodeModuleResolver, 'commonjs')
  .option('--babel', 'babel support')
  .option('-f, --force', 'force on non-empty directory')
  .action(run)
  .parse(process.argv);

async function run(projectName) {

  projectName = projectName
    .replace(/[^A-Za-z0-9.-/]+/g, '-')
    .replace(/^[-_.]+|-+$/g, '')
    .toLowerCase();
  const DEST_DIR = isAbsolute(projectName) ? projectName : resolve(process.cwd(), projectName);

  try {
    try {
      await access(DEST_DIR, F_OK);
    }
    catch (err) {

      console.log(`Destination does not exist, create '${projectName}'`);
      await mkdir(DEST_DIR, { mode: MODE_RWX, recursive: true });
    }
  }
  catch (err) {
    console.error(err);
  }

  try {
    try {
      const dir = await opendir(DEST_DIR);
      const { done: isEmpty } = await dir[Symbol.asyncIterator]().next();

      if (!isEmpty && !program.force) {

        const ok = await confirm('Destination is not empty, overwrite existing files? [y/n] ');

        if (ok) process.stdin.destroy();
        else {
          console.log('aborted');
          process.exit(1);
        }
      }

      await generateApp(DEST_DIR);

      const yarn = hasYarn();
      const { dependencies, devDependencies } = getDependencies();

      // install
      await shell(yarn ? 'yarn add ' + dependencies : 'npm i ' + dependencies, { cwd: DEST_DIR, text: 'Installing dependencies' });
      await shell(yarn ? 'yarn add -D ' + devDependencies : 'npm i -D ' + devDependencies, { cwd: DEST_DIR, text: 'Installing dependencies' });
      await shell(yarn ? 'yarn lint --fix' : 'npm run lint --fix', { cwd: DEST_DIR, text: 'Installing dependencies' });
      // done
      console.clear();
      console.log('\x1b[0m%s \x1b[1m\x1b[34m%s\x1b[0m', 'Your project is created at', DEST_DIR);
      console.log('To start, navigate to it and run:');
      console.log('\x1b[1m\x1b[34m%s\x1b[0m', `${yarn ? 'yarn' : 'npm'} start`);
    }
    catch (err) {

      if ('EACCES' !== err.code) await rmdir(DEST_DIR, { maxRetries: 3, recursive: true });
      else console.error(err);
    }
  }
  catch (err) {
    console.error(err);
  }
}

function setViewEngine(engine) {

  const supportEngines = ['pug', 'ejs', 'hbs'];

  if (!supportEngines.includes(engine)) {

    console.log('Unsupported view engine', engine, '\n');
    program.help();
    return;
  }

  /* eslint-disable-next-line consistent-return */
  return engine;
}

function setLinter(rule) {

  const supportRules = ['pk', 'recommended'];

  if (!supportRules.includes(rule)) {

    console.log('Unsupported linting with', rule, '\n');
    program.help();
    return;
  }

  /* eslint-disable-next-line consistent-return */
  return rule;
}

function setStyle(type) {

  const supportStyles = ['css', 'sass', 'scss', 'less', 'styl'];

  if (!supportStyles.includes(type)) {

    console.log('Unsupported style', type, '\n');
    program.help();
    return;
  }

  /* eslint-disable-next-line consistent-return */
  return type;
}

async function generateApp(dest) {

  const moduleType = 'commonjs' === program.resolver ? 'cjs' : 'mjs';
  const fileMap = await collectFileMap(moduleType);
  const mkdirs = [];
  const mkfiles = [];

  for (let i = fileMap.length; 0 <= --i;) {

    const file = fileMap[i];
    const from = `${BOILERPLATE_DIR}/${moduleType}/${file.name}`;
    const to = dest + (file.name.endsWith('gitignore') ? '/.gitignore' : file.name);

    if (file.isDir) {
      mkdirs.push(mkdir(to, { mode: MODE_RWX, recursive: true }));
    }
    else {
      if (file.name.includes('babel') && !program.babel) continue;
      /**
       it is unsafe to call fsPromises.writeFile() multiple times on the same file without waiting for the Promise to be resolved (or rejected).
       @see https://nodejs.org/api/fs.html#fs_fspromises_writefile_file_data_options
       */
      mkfiles.push({ from, to });
    }
  }

  const clientScript = '/public/src/index.js';
  const appConfig = '/config/app.js';

  try {
    let [view, appContent, clientScriptContent] = await Promise.all([
      getView(moduleType),
      readFile(`${BOILERPLATE_DIR}/${moduleType}/${appConfig}`, 'utf8'),
      readFile(`${BOILERPLATE_DIR}/${moduleType}/${clientScript}`, 'utf8'),
    ]);
    appContent = appContent.replace('<@ engine @>', program.view);
    clientScriptContent = clientScriptContent.replace('<@ style @>', program.style);

    mkfiles.push({ from: `${BOILERPLATE_DIR}/${moduleType + view}`, to: dest + view });
    mkfiles.push(...createEnv(dest));
    mkfiles.push(createPackageJson(dest, moduleType));
    mkfiles.push(createWebpack(dest, moduleType));
    mkfiles.push(await createStyle(dest, moduleType));
    mkfiles.push({ content: appContent, to: dest + appConfig });
    mkfiles.push({ content: clientScriptContent, to: dest + clientScript });
    if (program.eslint) mkfiles.push(...createEslint(dest, moduleType));

    await Promise.all(mkdirs);
    await Promise.all(mkfiles.map((file) => (file.hasOwnProperty('content') ?
      writeFile(file.to, file.content, { encoding: 'utf8', mode: MODE_RW }) :
      copyFile(file.from, file.to))));
  }
  catch (err) {

    console.log(err);
    throw err;
  }
}

function createEnv(dest) {

  return [
    { content: 'PORT=3000', to: dest + '/.env' },
    { content: 'PORT=', to: dest + '/.env.example' },
  ];
}

function createEslint(dest, moduleType) {

  const eslintConfig = require('../boilerplate/eslint')(program.eslint);

  return [
    { content: 'module.exports = ' + JSON.stringify(eslintConfig.node, null, 2), to: dest + `/.eslintrc.${'cjs' === moduleType ? '' : 'c'}js` },
    { content: 'module.exports = ' + JSON.stringify(eslintConfig.browser, null, 2), to: dest + `/public/.eslintrc.${'cjs' === moduleType ? '' : 'c'}js` },
  ];
}

function createPackageJson(dest, moduleType) {

  const pkgContent = require('../boilerplate/package.js')(basename(dest), moduleType);

  if (program.eslint) {

    pkgContent.scripts.lint = 'eslint --ext .js .';
  }

  return { content: JSON.stringify(pkgContent, null, 2), to: dest + '/package.json' };
}

async function createStyle(dest, moduleType) {

  const ext = 'sass' === program.style || 'styl' === program.style ? 'sass' : 'css';
  const content = await readFile(`${BOILERPLATE_DIR}/${moduleType}/public/src/index.${ext}`, 'utf8');

  return { content, to: `${dest}/public/src/index.${program.style}` };
}

function createWebpack(dest, moduleType) {

  const config = require(`../boilerplate/${moduleType}/webpack/shared`)({
    babel: !!program.babel,
    style: program.style,
  });

  return { content: config, to: dest + '/webpack/shared.js' };
}

async function getView(moduleType) {

  const files = await readdir(`${BOILERPLATE_DIR}/${moduleType}/views`, { withFileTypes: true });
  const ext = '.' + program.view;

  for (const file of files) {

    if (file.name.endsWith(ext)) return '/views/' + file.name;
  }
}

/**
 * Prompt for confirmation on STDOUT/STDIN
 * thank for express-generator
 */
function confirm(msg) {

  return new Promise((_resolve) => {

    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(msg, function(input) {

      rl.close();
      _resolve(/^y|yes$/i.test(input));
    });
  });
}

function hasYarn() {

  try {
    execSync('yarn -v', { stdio: 'ignore' });
    return true;
  }
  catch (err) {
    return false;
  }
}

function shell(cmd, { cwd, text }) {

  return new Promise((_resolve, reject) => {

    const spinner = new Spinner(text);

    spinner.setSpinnerString(27);
    spinner.start();
    const childProc = exec(cmd, { cwd, stdio: 'ignore' });
    /* eslint-disable-next-line no-unused-vars */
    childProc.on('exit', (code) => {

      spinner.stop(true);
      _resolve(undefined);
    });
    childProc.on('error', (err) => reject(err));
  });
}

function setNodeModuleResolver(type) {

  const supportResolvers = ['commonjs', 'module'];

  if (!supportResolvers.includes(type)) {

    console.log('Unsupported node module resolver', type, '\n');
    program.help();
    return;
  }

  /* eslint-disable-next-line consistent-return */
  return type;
}

function getDependencies() {

  const packages = {
    dependencies: [
      'dotenv',
      'express',
      'morgan',
    ],
    devDependencies: [
      'clean-webpack-plugin',
      'cross-env',
      'css-loader',
      'css-minimizer-webpack-plugin',
      'mini-css-extract-plugin',
      'nodemon',
      'webpack',
      'webpack-dev-middleware',
      'webpack-hot-middleware',
      'webpack-merge',
    ],
  };

  packages.dependencies.push(program.view);

  switch (program.style) {
    case 'sass':
    case 'scss':
      packages.devDependencies.push('sass', 'sass-loader');
      break;
    case 'styl':
      packages.devDependencies.push('stylus', 'stylus-loader');
      break;
    case 'less':
      packages.devDependencies.push('less', 'less-loader');
      break;
  }

  if (program.eslint) {

    packages.devDependencies.push('eslint');

    if ('pk' === program.eslint) packages.devDependencies.push('eslint-config-pk');
  }

  if (program.babel) {

    packages.dependencies.push('@babel/runtime', '@babel/runtime-corejs3');
    packages.devDependencies.push('@babel/core', '@babel/plugin-transform-runtime', '@babel/preset-env', 'babel-loader');
  }

  return {
    dependencies: packages.dependencies.join(' '),
    devDependencies: packages.devDependencies.join(' '),
  };
}
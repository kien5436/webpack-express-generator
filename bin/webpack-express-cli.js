#!/usr/bin/env node

const { basename, isAbsolute, join, resolve } = require('path');
const { constants: { F_OK }, promises: { access, copyFile, mkdir, opendir, readdir, readFile, rmdir, writeFile } } = require('fs');
const { createInterface } = require('readline');
const { exec, execSync } = require('child_process');
const { program } = require('commander');
const { Spinner } = require('cli-spinner');

const { version: VERSION } = require('../package.json');
const BOILERPLATE_DIR = join(__dirname, '../boilerplate');
const MODE_RW = parseInt('0666', 8);
const MODE_RWX = parseInt('0755', 8);

program
  .name('we')
  .version(VERSION, '-v, --version')
  .usage('<project-name> [options]')
  .arguments('<project-name>')
  .option('--eslint <rule>', `eslint config support:
                   recommended: eslint recommendation,
                   pk: my recommendation for eslint`, setLinter)
  .option('--style <type>', 'stylesheet support (css|sass|scss|less|styl)', setStyle, 'css')
  .option('--view <engine>', 'view engine support (pug|ejs|hbs)', setViewEngine, 'pug')
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
          return;
        }
      }

      await generateApp(DEST_DIR);

      const yarn = hasYarn();

      // install
      await shell(yarn ? 'yarn' : 'npm i', { cwd: DEST_DIR, text: 'Installing dependencies' });
      // build
      await shell(yarn ? 'yarn build' : 'npm run build', { cwd: DEST_DIR, text: 'Building' });
      // done
      console.log('Your project is created at ' + DEST_DIR);
      console.log('To start, navigate to it and run:');
      console.log(yarn ? 'yarn start' : 'npm start');
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

  const fileMap = require('../boilerplate/file-map');
  const mkdirs = [];
  const mkfiles = [];

  for (let i = fileMap.length; 0 <= --i;) {

    const file = fileMap[i];
    const from = BOILERPLATE_DIR + file.name;
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

  const clientScript = '/client/src/scripts/index.js';
  const appConfig = '/config/app.js';

  try {
    let [view, appContent, clientScriptContent] = await Promise.all([
      getView(),
      readFile(BOILERPLATE_DIR + appConfig, 'utf8'),
      readFile(BOILERPLATE_DIR + clientScript, 'utf8'),
    ]);
    appContent = appContent.replace('<@ engine @>', program.view);
    clientScriptContent = clientScriptContent.replace('<@ style @>', program.style);

    mkfiles.push({ from: BOILERPLATE_DIR + view, to: dest + view });
    mkfiles.push(...createEnv(dest));
    mkfiles.push(createPackageJson(dest));
    mkfiles.push(createWebpack(dest));
    mkfiles.push(await createStyle(dest));
    mkfiles.push({ content: appContent, to: dest + appConfig });
    mkfiles.push({ content: clientScriptContent, to: dest + clientScript });
    if (program.eslint) mkfiles.push(...createEslint(dest));

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

function createEslint(dest) {

  const eslintConfig = require('../boilerplate/eslint')(program.eslint);

  return [
    { content: JSON.stringify(eslintConfig.node, null, 2), to: dest + '/.eslintrc.json' },
    { content: JSON.stringify(eslintConfig.browser, null, 2), to: dest + '/client/.eslintrc.json' },
  ];
}

function createPackageJson(dest) {

  const pkgContent = require('../boilerplate/package.js')(basename(dest), !!program.eslint);
  let viewEngineVer = '';

  switch (program.view) {
    case 'hbs':
      viewEngineVer = '^4.1.1';
      break;
    case 'ejs':
      viewEngineVer = '^3.1.5';
      break;
    case 'pug':
    default:
      viewEngineVer = '^2.0.4';
      break;
  }
  pkgContent.dependencies[program.view] = viewEngineVer;

  switch (program.style) {
    case 'sass':
    case 'scss':
      pkgContent.devDependencies['sass'] = '^1.26.10';
      pkgContent.devDependencies['sass-loader'] = '^7.1.0';
      break;
    case 'styl':
      pkgContent.devDependencies['stylus'] = '^0.54.8';
      pkgContent.devDependencies['stylus-loader'] = '^3.0.2';
      break;
    case 'less':
      pkgContent.devDependencies['less'] = '^3.12.2';
      pkgContent.devDependencies['less-loader'] = '^7.0.1';
      break;
  }

  if (program.eslint) {

    pkgContent.scripts.lint = 'eslint --ext .js .';
    pkgContent.devDependencies.eslint = '^7.8.1';
    if ('pk' === program.eslint) pkgContent.devDependencies['eslint-config-pk'] = '^1.0.0';
  }

  if (program.babel) {

    pkgContent.dependencies['@babel/runtime'] = '^7.11.2';
    pkgContent.dependencies['@babel/runtime-corejs3'] = '^7.11.2';
    pkgContent.devDependencies['@babel/core'] = '^7.11.6';
    pkgContent.devDependencies['@babel/plugin-transform-runtime'] = '^7.11.5';
    pkgContent.devDependencies['@babel/preset-env'] = '^7.11.5';
    pkgContent.devDependencies['babel-loader'] = '^8.1.0';
  }

  return { content: JSON.stringify(pkgContent, null, 2), to: dest + '/package.json' };
}

async function createStyle(dest) {

  const ext = 'sass' === program.style || 'styl' === program.style ? 'sass' : 'css';
  const content = await readFile(`${BOILERPLATE_DIR}/client/src/styles/index.${ext}`, 'utf8');

  return { content, to: `${dest}/client/src/styles/index.${program.style}` };
}

function createWebpack(dest) {

  const config = require('../boilerplate/client/webpack/shared')({
    babel: !!program.babel,
    style: program.style,
  });

  return { content: config, to: dest + '/client/webpack/shared.js' };
}

async function getView() {

  const files = await readdir(BOILERPLATE_DIR + '/views', { withFileTypes: true });
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
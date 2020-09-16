#!/usr/bin/env node

const { createInterface } = require('readline');
const { basename, isAbsolute, join, resolve } = require('path');
const { program } = require('commander');
const { constants: { F_OK }, promises: { access, copyFile, mkdir, opendir, readdir, readFile, rmdir, writeFile } } = require('fs');
const { execSync } = require('child_process');

const { version: VERSION } = require('../package.json');
const BOILERPLATE_DIR = join(__dirname, '../boilerplate');
const MODE_RW = parseInt('0666', 8);
const MODE_RWX = parseInt('0755', 8);

program
  .name('we')
  .version(VERSION, '-v, --version')
  .usage('<project-name> [options]')
  .arguments('<project-name>')
  .option('--view <engine>', 'view engine support (pug|ejs|hbs)', setViewEngine, 'pug')
  .option('--eslint <rule>', `eslint config support:
                 recommended: eslint recommendation,
                 pk: my recommendation for eslint`, setLinter)
  .option('--style <type>', 'stylesheet support (css|sass|scss|less|styl)', setStyle, 'css')
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
    await access(DEST_DIR, F_OK);
  }
  catch (err) {

    await mkdir(DEST_DIR, { mode: MODE_RWX, recursive: true });
    console.log(`Destination does not exist, create '${projectName}'`);
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

      await generateApp(DEST_DIR, projectName);

      // install
      // if (process.platform === 'win32') execSync(`cd /d ${DEST_DIR}`);
      // else execSync(`cd ${DEST_DIR}`);
      // console.log('Installing dependencies...');
      // execSync('');

      // // build
      // console.log('Building...');

      // done
      console.log('Your project is created at ' + DEST_DIR);
      console.log('To start, run:');
      console.log('npm i && npm run build && npm start');
      console.log('or');
      console.log('yarn && yarn build && yarn start');
    }
    catch (err) {

      if ('EACCES' !== err.code) await rmdir(DEST_DIR, { maxRetries: 3, recursive: true });
      else console.error('ERROR', err);
    }
  }
  catch (err) {
    console.error(err);
  }
}

function setViewEngine(engine) {

  const supportEngines = ['pug', 'ejs', 'hbs' ];

  if (!supportEngines.includes(engine)) {

    console.log('Unsupported view engine', engine, '\n');
    program.help();
    return;
  }

  /* eslint-disable-next-line consistent-return */
  return engine;
}

function setLinter(rule) {

  const supportRules = ['pk', 'recommended' ];

  if (!supportRules.includes(rule)) {

    console.log('Unsupported linting with', rule, '\n');
    program.help();
    return;
  }

  /* eslint-disable-next-line consistent-return */
  return rule;
}

function setStyle(type) {

  const supportStyles = ['css', 'sass', 'scss', 'less', 'styl' ];

  if (!supportStyles.includes(type)) {

    console.log('Unsupported style', type, '\n');
    program.help();
    return;
  }

  /* eslint-disable-next-line consistent-return */
  return type;
}

async function generateApp(dest, projectName) {

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
    let [views, appContent, clientScriptContent ] = await Promise.all([
      getViews(),
      readFile(BOILERPLATE_DIR + appConfig, 'utf8'),
      readFile(BOILERPLATE_DIR + clientScript, 'utf8'),
    ]);
    appContent = appContent.replace('<@ engine @>', program.view);
    clientScriptContent = clientScriptContent.replace('<@ style @>', program.style);

    views.forEach((view) => mkfiles.push({ from: BOILERPLATE_DIR + view, to: dest + view }));
    mkfiles.push(...createEnv(dest));
    mkfiles.push(...await createWebpack(dest));
    mkfiles.push(createPackageJson(dest, projectName));
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
    console.error(err);
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

function createPackageJson(dest, projectName) {

  const packageContent = require('../boilerplate/package.js')(basename(projectName), !!program.eslint);
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
  packageContent.dependencies[program.view] = viewEngineVer;

  switch (program.style) {
    case 'sass':
    case 'scss':
      packageContent.devDependencies['sass'] = '^1.26.10';
      packageContent.devDependencies['sass-loader'] = '^7.1.0';
      break;
    case 'styl':
      packageContent.devDependencies['stylus'] = '^0.54.8';
      packageContent.devDependencies['stylus-loader'] = '^3.0.2';
      break;
    case 'less':
      packageContent.devDependencies['less'] = '^3.12.2';
      packageContent.devDependencies['less-loader'] = '^7.0.1';
      break;
  }

  if (program.eslint) {

    packageContent.scripts.lint = 'eslint -c .eslintrc.json --ext .js .';
    packageContent.devDependencies.eslint = '^7.8.1';
  }

  return { content: JSON.stringify(packageContent, null, 2), to: dest + '/package.json' };
}

async function createStyle(dest) {

  const ext = 'sass' === program.style || 'styl' === program.style ? 'sass' : 'css';
  const content = await readFile(`${BOILERPLATE_DIR}/client/src/styles/index.${ext}`, 'utf8');

  return { content, to: `${dest}/client/src/styles/index.${program.style}` };
}

async function createWebpack(dest) {

  let [configDev, configProd ] = await Promise.all([
    readFile(BOILERPLATE_DIR + filename('dev'), 'utf8'),
    readFile(BOILERPLATE_DIR + filename('prod'), 'utf8'),
  ]);
  configDev = configDev.replace('<@ style @>', program.style);
  configProd = configProd.replace('<@ style @>', program.style);

  return [
    { content: configDev, to: dest + filename('dev') },
    { content: configProd, to: dest + filename('prod') },
  ];

  function filename(type) {
    return `/client/webpack/config.${type}.js`;
  }
}

async function getViews() {

  const files = await readdir(BOILERPLATE_DIR + '/views', { withFileTypes: true });
  const ext = '.' + program.view;
  const views = [];

  for (const file of files) {

    if (file.name.endsWith(ext)) views.push('/views/' + file.name);
  }

  return views;
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
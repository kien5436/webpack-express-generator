#!/usr/bin/env node

const { createInterface } = require('readline');
const { join } = require('path');
const { program } = require('commander');
const { promises: { readFile, mkdir, writeFile, copyFile, rmdir, readdir, opendir }, existsSync } = require('fs');

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
  .option('-f, --force', 'force on non-empty directory')
  .action(run)
  .parse(process.argv);

async function run(projectName) {

  projectName = projectName.endsWith('/') ? projectName.substring(0, projectName.length - 1) : projectName;
  const DEST_DIR = projectName.startsWith('/') ? projectName : `${process.cwd()}/${projectName}`;

  try {
    try {
      if (!existsSync(DEST_DIR)) await mkdir(DEST_DIR, { mode: MODE_RWX, recursive: true });
      else {
        const dir = await opendir(DEST_DIR);
        const { done: isEmpty } = await dir[Symbol.asyncIterator]()
          .next();

        if (!isEmpty && !program.force) {

          const ok = await confirm('Destination is not empty, overwrite everything inside? [y/n] ');

          if (ok) process.stdin.destroy();
          else {
            console.log('aborted');
            process.exit(1);
            return;
          }
        }
      }

      await Promise.all([
        generateApp(DEST_DIR),
        generatePackageJson(DEST_DIR, projectName),
      ]);

      if (program.eslint) await generateEslint(DEST_DIR);

      console.log('Your project is created at ' + DEST_DIR);
      console.log('To start, run:');
      console.log('npm i && npm run build && npm start');
      console.log('or');
      console.log('yarn && yarn build && yarn start');
    }
    catch (err) {

      console.error(err);

      if ('EACCES' !== err.code) await rmdir(DEST_DIR, { maxRetries: 3, recursive: true });
    }
  }
  catch (err) {
    console.error(err);
  }
}

async function generateApp(dest) {

  const fileMap = require('../boilerplate/file-map');
  const mkdirs = [];
  const mkfiles = [];

  for (let i = fileMap.length; 0 <= --i;) {

    const file = fileMap[i];
    const from = BOILERPLATE_DIR + file.name;
    const to = dest + file.name;

    if (file.isDir) {
      mkdirs.push(mkdir(to, { mode: MODE_RWX, recursive: true }));
    }
    else {
      if ('/config/app.js' === file.name) {

        /* eslint-disable-next-line no-await-in-loop */
        let [views, appContent] = await Promise.all([
          getViews(),
          readFile(from, 'utf8'),
        ]);
        appContent = appContent.replace('<@ engine @>', program.view);

        /* eslint-disable-next-line no-await-in-loop */
        await Promise.all(views.map((view) => copyFile(BOILERPLATE_DIR + view, dest + view)));
        /* eslint-disable-next-line no-await-in-loop */
        await writeFile(to, appContent, { encoding: 'utf8', mode: MODE_RW });
      }
      else mkfiles.push(copyFile(from, to));
    }
  }

  await Promise.all(mkdirs);
  await Promise.all(mkfiles);
}

async function generateEslint(dest) {

  const eslintConfig = require('../boilerplate/eslint')(program.eslint);

  await Promise.all([
    writeFile(dest + '/.eslintrc.json', JSON.stringify(eslintConfig.node, null, 2), { mode: MODE_RW }),
    writeFile(dest + '/client/.eslintrc.json', JSON.stringify(eslintConfig.browser, null, 2), { mode: MODE_RW }),
  ]);
}

async function generatePackageJson(dest, projectName) {

  projectName = projectName.match(/(\w+)\/?$/)[1];
  const packageContent = require('../boilerplate/package.js')(projectName, !!program.eslint);
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

  await writeFile(dest + '/package.json', JSON.stringify(packageContent, null, 2), { mode: MODE_RW });
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

  return new Promise((resolve) => {

    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(msg, function(input) {

      rl.close();
      resolve(/^y|yes$/i.test(input));
    });
  });
}
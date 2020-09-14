#!/usr/bin/env node

const { promises: { readFile, copyFile, chmod, readdir, writeFile, mkdir } } = require('fs');
const { join, resolve } = require('path');
const { createInterface } = require('readline');
const { promisify } = require('util');

const BOILERPLATE_DIR = join(__dirname, '../boilerplate');
const ROOT_DIR = join(__dirname, '../');
const MODE_RWX = parseInt('0755', 8);
const MODE_RW = parseInt('0666', 8);

(async () => {

  try {
    const ok = await confirm('does it work?');

    console.info('test-cli.js:18: ', ok);

  }
  catch (err) {
    console.error(err);
  }
})();

/**
 * Prompt for confirmation on STDOUT/STDIN
 * thanks for express-generator
 */
function confirm(msg, callback = undefined) {

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

async function getViews() {

  try {
    const files = await readdir(BOILERPLATE_DIR + '/views', { withFileTypes: true });

    for (let i = files.length; 0 <= --i;) {

      if (files[i].name.endsWith('.pug')) files.splice(i, 1);
    }

    return files;
  }
  catch (err) {
    throw err;
  }
}
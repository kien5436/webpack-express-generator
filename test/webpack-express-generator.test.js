const { resolve } = require('path');
const { promises: { rmdir, readFile } } = require('fs');

const ROOT_DIR = '/tmp/app';

describe(`we ${ROOT_DIR}`, function() {

  after(function(done) {

    this.timeout(30000);
    rmdir(ROOT_DIR, { maxRetries: 3, recursive: true });
  });

  // describe();
});
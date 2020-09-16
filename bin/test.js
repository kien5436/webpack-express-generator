/* eslint-disable */

const { promises: { mkdir, writeFile, rmdir } } = require('fs');

(async () => {

  const dirs = ['/tmp/test', '/tmp/test/dir1', '/tmp/test/dir2'];
  const mkdirs = [];
  const mkfiles = [];

  for (let i = 0; i < dirs.length; i++) {
    const dir = dirs[i];
    mkdirs.push(mkdir(dir, { recursive: true, mode: parseInt('0755', 8) }));
    mkfiles.push((dir + '/file.txt'));
  }
  // console.info('test.js:14: ', mkdirs, mkfiles)

  // for (let i = 0; i < dirs.length; i++) {
  //   const dir = dirs[i];
  //   mkdirs.push(dir);
  //   mkfiles.push(dir + '/file.txt');
  // }

  // const _dirs = mkdirs.map(dir => mkdir(dir, { recursive: true }));
  // const files = mkfiles.map(file => writeFile(file, ''));
  // console.info('test.js:24: ', _dirs, files)

  try {
    // const mkdirs = [
    //   mkdir('/tmp/test', { recursive: true }),
    //   mkdir('/tmp/test/dir1', { recursive: true }),
    //   mkdir('/tmp/test/dir2', { recursive: true }),
    // ];

    await Promise.all(mkdirs);
    await Promise.all(mkfiles.map(file => writeFile(file, '')));

    console.info('test.js:18: done')
  }
  catch (err) {
    console.error(err);
  }
  finally {
    rmdir('/tmp/test', { recursive: true })
  }
})()
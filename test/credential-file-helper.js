'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');

const test = require('ava');
const mockery = require('mockery');
const temp = require('temp');

const credentialFileHelper = '../lib/credential-file-helper.js';

const convertPath = (p) => p.replace(/\//g, path.sep);

test.beforeEach(() => {
  mockery.enable({ useCleanCache: true });
  mockery.registerAllowable(credentialFileHelper, true);
  mockery.registerAllowables(['os', 'path', 'readline', 'stream', 'util', './credential-parser.js', './credential-to-json.js', './json-to-credential.js']);
});

test.afterEach(() => {
  mockery.warnOnUnregistered(true);
  mockery.deregisterAll();
  mockery.resetCache();
  mockery.disable();
});

test.serial('it should set the path values to default if they are not supplied', (t) => {
  mockery.registerAllowables(['fs']);
  const CredentialHelper = require(credentialFileHelper);
  const c = new CredentialHelper();

  t.deepEqual(c.path, CredentialHelper.DEFAULT_PATH);
});

test.serial('non-existant paths should be invalid', (t) => {
  const fsModule = {
    access: (p, cb) => cb(new Error('does not exist'))
  };

  mockery.registerMock('fs', fsModule);
  const CredentialHelper = require(credentialFileHelper);
  const c = new CredentialHelper(convertPath('/i/dont/exist'));

  t.throws(c.isValidFilePath());
});

test.serial('existing paths should be valid', (t) => {
  const fsModule = {
    access: (p, cb) => cb()
  };

  mockery.registerMock('fs', fsModule);
  const CredentialHelper = require(credentialFileHelper);
  const c = new CredentialHelper();

  return c.isValidFilePath();
});

test.serial('it should find the default profile', (t) => {
  mockery.registerAllowables(['fs']);
  const CredentialHelper = require(credentialFileHelper);
  const c = new CredentialHelper('./fixtures/default-only');

  return c.profileExists('default').then((found) => t.deepEqual(found, 'default'));
});

test.serial('it should resolve with false if the profile doesnt exist', (t) => {
  mockery.registerAllowables(['fs']);
  const CredentialHelper = require(credentialFileHelper);
  const c = new CredentialHelper('./fixtures/default-only');

  return c.profileExists('doesnt_exist').then((r) => t.false(r));
});

test.serial('backup file name should be generated correctly', (t) => {
  mockery.registerAllowables(['fs']);
  const CredentialHelper = require(credentialFileHelper);
  const c = new CredentialHelper(path.join(process.cwd(), 'fixtures', 'default-only'));

  const result = c.makeBackupName(1);
  t.deepEqual(result, 'default-only.1.blink-backup');
});

test.serial('backup should throw an error if the path doesnt exist', (t) => {
  mockery.registerAllowables(['fs']);
  const CredentialHelper = require(credentialFileHelper);
  const c = new CredentialHelper(path.join(process.cwd(), 'does-not', 'exist'));

  t.throws(c.backup());
});

test.serial('the next number in the sequence should be returned', (t) => {
  mockery.registerAllowables(['fs']);
  const CredentialHelper = require(credentialFileHelper);
  const c = new CredentialHelper(path.join(process.cwd(), 'does-not', 'exist'));
  const files = [
    c.makeBackupName(0),
    c.makeBackupName(10),
    c.makeBackupName(3),
    c.makeBackupName(2),
    c.makeBackupName(4),
    c.makeBackupName(6),
    c.makeBackupName(5)
  ];

  const result = c.getNextBackupNumber(files);
  t.deepEqual(result, 11);
});

test.serial('getNextBackupNumber should handle an empty array', (t) => {
  mockery.registerAllowables(['fs']);
  const CredentialHelper = require(credentialFileHelper);
  const c = new CredentialHelper(path.join(process.cwd(), 'does-not', 'exist'));
  const files = [];

  const result = c.getNextBackupNumber(files);
  t.deepEqual(result, 1);
});

test.cb('backup should work', (t) => {
  mockery.registerAllowables(['fs']);
  const folder = 'temp-credentials';
  const fileContents = 'test file contents';
  temp.track();

  temp.mkdir(folder, (err, dir) => {
    if (err) {
      t.fail(err);
      t.end();
      return;
    }

    const credentialsFile = path.join(dir, 'credentials');
    fs.writeFile(credentialsFile, fileContents, (err) => {
      if (err) {
        t.fail(err);
        t.end();
        return;
      }

      const CredentialHelper = require(credentialFileHelper);
      const c = new CredentialHelper(credentialsFile);
      c.backup().then((backupFile) => {
        const basename = path.basename(backupFile);
        const expectedName = `credentials.1${CredentialHelper.BACKUP_EXT}`;
        t.deepEqual(basename, expectedName);
        fs.readFile(backupFile, (err, data) => {
          if (err) {
            t.fail();
            t.end();
            return;
          }

          t.deepEqual(data.toString('utf-8'), fileContents);
          t.pass();
          t.end();
        });
      });
    });
  });
});

test.cb('saveCredentials should create the credentials file with the new profile', (t) => {
  mockery.registerAllowables(['fs']);
  const folder = 'temp-credentials';
  temp.track();
  temp.mkdir(folder, (err, dir) => {
    if (err) {
      t.fail(err);
      t.end();
      return;
    }
    const credentialsFile = path.join(dir, 'credentials');
    const profile = {
      name: 'test',
      aws_access_key_id: 'aaaaaaaaaaaaaaaaaaaa',
      aws_secret_access_key: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
    };
    const CredentialHelper = require(credentialFileHelper);
    const c = new CredentialHelper(credentialsFile);
    c.saveCredentials(profile).then((credentialsPath) => {
      // file exists
      t.notThrows(() => fs.accessSync(credentialsPath));

      const contents = fs.readFileSync(credentialsPath).toString().trim().split(os.EOL);
      t.deepEqual(contents.length, 3);
      t.deepEqual(contents[0], '[test]');
      t.deepEqual(contents[1], 'aws_access_key_id = aaaaaaaaaaaaaaaaaaaa');
      t.deepEqual(contents[2], 'aws_secret_access_key = bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
      t.pass();
      t.end();
    }).catch((err) => {
      console.log(err);
      t.fail(err);
      t.end();
    });
  });
});

test.cb('saveCredentials should overwrite the old file with a new entry', (t) => {
  mockery.registerAllowables(['fs']);
  const folder = 'temp-credentials';
  temp.track();
  temp.mkdir(folder, (err, dir) => {
    if (err) {
      t.fail(err);
      t.end();
      return;
    }

    const src = fs.createReadStream(path.join('fixtures', 'two'));
    const credentialsFile = path.join(dir, 'credentials');
    const dest = fs.createWriteStream(credentialsFile);

    dest.on('finish', () => {
      const profile = {
        name: 'second',
        aws_access_key_id: '55555555555555555555',
        aws_secret_access_key: '6666666666666666666666666666666666666666'
      };
      const CredentialHelper = require(credentialFileHelper);
      const c = new CredentialHelper(credentialsFile);
      c.saveCredentials(profile).then((credentialsPath) => {
        // file exists
        t.notThrows(() => fs.accessSync(credentialsPath));

        // backup has been made
        t.deepEqual(fs.readdirSync(dir).length, 2);

        // contents are correct
        const contents = fs.readFileSync(credentialsPath).toString().trim().split(os.EOL);
        t.deepEqual(contents.length, 9);
        t.deepEqual(contents[0], '[default]');
        t.deepEqual(contents[1], 'aws_access_key_id = 11111111111111111111');
        t.deepEqual(contents[2], 'aws_secret_access_key = 2222222222222222222222222222222222222222');
        t.deepEqual(contents[3], '[first]');
        t.deepEqual(contents[4], 'aws_access_key_id = 33333333333333333333');
        t.deepEqual(contents[5], 'aws_secret_access_key = 4444444444444444444444444444444444444444');
        t.deepEqual(contents[6], '[second]');
        t.deepEqual(contents[7], 'aws_access_key_id = 55555555555555555555');
        t.deepEqual(contents[8], 'aws_secret_access_key = 6666666666666666666666666666666666666666');
        t.pass();
        t.end();
      }).catch((err) => {
        console.log(err);
        t.fail(err);
        t.end();
      });
    });
    dest.on('error', () => {
      t.fail();
      t.end();
    });
    src.pipe(dest);
  });
});

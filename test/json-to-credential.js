'use strict';

const fs = require('fs');

const test = require('ava');
const mockery = require('mockery');
const JSONtoCredentials = '../lib/json-to-credential.js';
const credentialsToJSON = '../lib/credential-to-json.js';
const devnull = require('dev-null');

test.cb.beforeEach((t) => {
  mockery.enable({ useCleanCache: true });
  mockery.registerAllowable(JSONtoCredentials, true);
  mockery.registerAllowables([
    'temp',
    'fs',
    'path',
    'constants',
    'rimraf',
    'assert',
    'os-tmpdir',
    'stream',
    'util',
    credentialsToJSON
  ]);
  t.end();
});

test.cb.afterEach((t) => {
  mockery.warnOnUnregistered(true);
  mockery.deregisterAll();
  mockery.resetCache();
  mockery.disable();
  t.end();
});

test('it should turn a profile json into a credentials entry string', (t) => {
  const toCredentials = require(JSONtoCredentials)();
  const profile = {
    default: {
      aws_access_key_id: '11111111111111111111',
      aws_secret_access_key: '2222222222222222222222222222222222222222'
    }
  };

  const result = toCredentials.chunkToArray(profile);
  t.same(result.length, 4);
  t.same(result[0], '[default]');
  t.same(result[1], 'aws_access_key_id = 11111111111111111111');
  t.same(result[2], 'aws_secret_access_key = 2222222222222222222222222222222222222222');
  t.same(result[3], '');
});

test.cb('it should call finish', (t) => {
  const fixture = './fixtures/default-only';
  const toCredentials = require(JSONtoCredentials)();
  const toJson = require(credentialsToJSON)();
  const src = fs.createReadStream(fixture);

  toCredentials.on('finish', () => t.end());
  src.pipe(toJson).pipe(toCredentials).pipe(devnull());
});

test.cb('it should write the json to a file', (t) => {
  const temp = require('temp');
  const fixture = './fixtures/default-only';
  const toCredentials = require(JSONtoCredentials)();
  const toJson = require(credentialsToJSON)();
  const src = fs.createReadStream(fixture);
  const writable = temp.createWriteStream();
  const pathToTemp = writable.path;

  temp.track();
  writable.on('finish', () => {
    fs.readFile(pathToTemp, 'utf-8', t.end);
  });
  src.pipe(toJson).pipe(toCredentials).pipe(writable);
});

test.cb('it should write the json to a file correctly', (t) => {
  const temp = require('temp');
  const fixture = './fixtures/default-only';
  const toCredentials = require(JSONtoCredentials)();
  const toJson = require(credentialsToJSON)();
  const src = fs.createReadStream(fixture);
  const expectedFileStructure = fs.readFileSync(fixture, 'utf-8').trim();
  const writable = temp.createWriteStream();
  const pathToTemp = writable.path;

  temp.track();
  writable.on('finish', () => {
    fs.readFile(pathToTemp, 'utf-8', (err, data) => {
      if (err) {
        temp.cleanupSync();
        return t.end(err);
      }
      t.same(data.trim(), expectedFileStructure);
      temp.cleanupSync();
      t.end();
    });
  });

  src.pipe(toJson).pipe(toCredentials).pipe(writable);
});

test.cb('it should update the file correctly', (t) => {
  const temp = require('temp');
  const fixture = './fixtures/malformed';
  const expected = './fixtures/three';
  const updatedProfile = {
    first: {
      aws_access_key_id: '33333333333333333333',
      aws_secret_access_key: '4444444444444444444444444444444444444444'
    }
  };
  const toCredentials = require(JSONtoCredentials)();
  const toJson = require(credentialsToJSON)(updatedProfile);
  const src = fs.createReadStream(fixture);
  const expectedFileStructure = fs.readFileSync(expected, 'utf-8').trim().replace(/\r/g, '').replace(/\n/g, '');
  const writable = temp.createWriteStream();
  const pathToTemp = writable.path;

  temp.track();
  writable.on('finish', () => {
    fs.readFile(pathToTemp, 'utf-8', (err, data) => {
      if (err) {
        temp.cleanupSync();
        return t.end(err);
      }
      t.same(data.trim().replace(/\r/g, '').replace(/\n/g, ''), expectedFileStructure);
      temp.cleanupSync();
      t.end();
    });
  });

  src.pipe(toJson).pipe(toCredentials).pipe(writable);
});

test.cb('it should write the new profile', (t) => {
  const temp = require('temp');
  const fixture = './fixtures/two';
  const expected = './fixtures/three';
  const updatedProfile = {
    second: {
      aws_access_key_id: '55555555555555555555',
      aws_secret_access_key: '6666666666666666666666666666666666666666'
    }
  };
  const toCredentials = require(JSONtoCredentials)();
  const toJson = require(credentialsToJSON)(updatedProfile);
  const src = fs.createReadStream(fixture);
  const expectedFileStructure = fs.readFileSync(expected, 'utf-8').trim().replace(/\r/g, '').replace(/\n/g, '');
  const writable = temp.createWriteStream();
  const pathToTemp = writable.path;

  temp.track();
  writable.on('finish', () => {
    fs.readFile(pathToTemp, 'utf-8', (err, data) => {
      if (err) {
        temp.cleanupSync();
        return t.end(err);
      }
      t.same(data.trim().replace(/\r/g, '').replace(/\n/g, ''), expectedFileStructure);
      temp.cleanupSync();
      t.end();
    });
  });

  src.pipe(toJson).pipe(toCredentials).pipe(writable);
});

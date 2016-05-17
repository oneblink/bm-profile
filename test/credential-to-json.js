'use strict';

const fs = require('fs');

const test = require('ava');
const mockery = require('mockery');
const streamTransformer = '../lib/credential-to-json.js';

test.cb.beforeEach((t) => {
  mockery.enable({ useCleanCache: true });
  mockery.registerAllowable(streamTransformer, true);
  mockery.registerAllowables(['stream', 'util', 'os']);
  t.end();
});

test.cb.afterEach((t) => {
  mockery.warnOnUnregistered(true);
  mockery.deregisterAll();
  mockery.resetCache();
  mockery.disable();
  t.end();
});

test.cb('it turns a single profile into an array with 3 entries', (t) => {
  const fixture = './fixtures/default-only';
  const transformer = require(streamTransformer)();
  fs.readFile(fixture, {encoding: 'utf-8'}, (err, data) => {
    if (err) {
      return t.end(err);
    }
    const result = transformer.chunkToArray(data);
    t.is(result.length, 3);
    t.is(result[0], '[default]');
    t.is(result[1], 'aws_access_key_id = 11111111111111111111');
    t.is(result[2], 'aws_secret_access_key = 2222222222222222222222222222222222222222');
    t.end();
  });
});

test.cb('it reads three profiles', (t) => {
  const fixture = './fixtures/three';
  const transformer = require(streamTransformer)();
  const credentialsFile = fs.createReadStream(fixture);
  const expectedProfileNames = ['default', 'first', 'second'];
  const expectedNumReads = 3;
  t.plan(expectedNumReads);
  let i = 0;
  const finish = () => ++i === expectedNumReads ? t.end() : null;

  transformer.on('readable', () => {
    const data = transformer.read();
    if (!data) {
      return;
    }

    const profileName = data.name;
    t.true(expectedProfileNames.indexOf(profileName) > -1);
    finish();
  });

  credentialsFile.pipe(transformer);
});

test.cb('it reads three profiles even when a profile is incomplete', (t) => {
  const fixture = './fixtures/malformed';
  const transformer = require(streamTransformer)();
  const credentialsFile = fs.createReadStream(fixture);
  const expectedProfileNames = ['default', 'first', 'second'];
  const expectedNumReads = 5;
  t.plan(expectedNumReads);
  let i = 0;
  const finish = () => ++i >= 3 ? t.end() : null;

  transformer.on('readable', () => {
    const data = transformer.read();
    if (!data) {
      return;
    }

    const profileName = data.name;
    t.true(expectedProfileNames.indexOf(profileName) > -1);
    if (profileName === expectedProfileNames[1]) {
      t.true(!!data.aws_access_key_id);
      t.false(!!data.aws_secret_access_key);
    }
    finish();
  });

  credentialsFile.pipe(transformer);
});

test.cb('it replaces the first profile', (t) => {
  const fixture = './fixtures/malformed';
  const firstProfile = {
    name: 'first',
    aws_access_key_id: 'aaaaaaaaaaaaaaaaaaaa',
    aws_secret_access_key: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
  };
  const transformer = require(streamTransformer)(firstProfile);
  const credentialsFile = fs.createReadStream(fixture);
  const expectedProfileNames = ['default', 'first', 'second'];
  const expectedNumReads = 5;
  t.plan(expectedNumReads);
  let i = 0;
  const finish = () => ++i >= 3 ? t.end() : null;

  transformer.on('readable', () => {
    const data = transformer.read();
    if (!data) {
      return;
    }

    const profileName = data.name;
    t.true(expectedProfileNames.indexOf(profileName) > -1);
    if (profileName === 'first') {
      t.same(data.aws_access_key_id, firstProfile.aws_access_key_id);
      t.same(data.aws_secret_access_key, firstProfile.aws_secret_access_key);
    }
    finish();
  });

  credentialsFile.pipe(transformer);
});

test.cb('it should add a new profile', (t) => {
  const fixture = './fixtures/three';
  const lastProfile = {
    name: 'last',
    aws_access_key_id: 'aaaaaaaaaaaaaaaaaaaa',
    aws_secret_access_key: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
  };
  const transformer = require(streamTransformer)(lastProfile);
  const credentialsFile = fs.createReadStream(fixture);
  const expectedProfileNames = ['default', 'first', 'second', 'last'];
  const expectedNumReads = 6;
  t.plan(expectedNumReads);
  let i = 0;
  const finish = () => ++i >= 4 ? t.end() : null;

  transformer.on('readable', () => {
    const data = transformer.read();
    if (!data) {
      return;
    }

    const profileName = data.name;
    t.true(expectedProfileNames.indexOf(profileName) > -1);
    if (profileName === 'last') {
      t.same(data.aws_access_key_id, lastProfile.aws_access_key_id);
      t.same(data.aws_secret_access_key, lastProfile.aws_secret_access_key);
    }
    finish();
  });

  credentialsFile.pipe(transformer);
});

'use strict';

const path = require('path');

const test = require('ava');
const mockery = require('mockery');

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

  t.same(c.path, CredentialHelper.DEFAULT_PATH);
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

  return c.profileExists('default').then((found) => t.same(found, 'default'));
});

test.serial('it should reject if the profile doesnt exist', (t) => {
  mockery.registerAllowables(['fs']);
  const CredentialHelper = require(credentialFileHelper);
  const c = new CredentialHelper('./fixtures/default-only');

  t.throws(c.profileExists('doesnt_exist'));
});

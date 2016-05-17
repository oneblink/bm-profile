'use strict';

const CredentialParser = {
  toJSON: require('./credential-to-json.js'),
  toCredentials: require('./json-to-credential.js')
};

module.exports = CredentialParser;

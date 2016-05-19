/**
 * Profile Configuration Module
 *
 * @module  profile-config
 */

'use strict';

const ask = require('ask-all-questions');
const CredentialsHelper = require('./credential-file-helper.js');
let credHelper;

function confirmOverwrite (profileName) {
  return ask([
    {name: 'answer', question: 'The profile already exists in your credentials file. Overwrite it? (yes/no) :'}
  ]).then((answers) => answers.answer[0].toLowerCase() === 'y')
    .catch((err) => {
      console.log(err);
      process.exit(1);
    });
}

function writeProfile (profileName) {
  return ask([
    {name: 'aws_access_key_id', question: 'Access Key: '},
    {name: 'aws_secret_access_key', question: 'Secret Key: '}
  ]).then((answers) => {
    answers.name = profileName;
    return credHelper.saveCredentials(answers);
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
}

/**
 * Configure a profile
 * @param  {string} profileName         The profile name to configure
 * @param  {string} credentialsFilePath The credential file path (optional)
 * @return {Promise}                     Resolves if successful, logs to console if an error happens
 */
module.exports = (profileName, credentialsFilePath) => {
  credHelper = new CredentialsHelper(credentialsFilePath);
  return credHelper.profileExists(profileName)
    .then((exists) => exists ? confirmOverwrite(profileName) : Promise.resolve(true))
    .then((overwrite) => overwrite ? writeProfile(profileName) : Promise.reject(new Error('User chose not to overwrite existing profile')))
    .catch((err) => {
      if (err.message !== 'User chose not to overwrite existing profile') {
        console.log(`There was a problem setting the configuration: ${err.message}`);
      }
    });
};


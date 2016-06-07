/**
 * Profile Configuration Module
 *
 * @module  profile-config
 */

'use strict';

const inquirer = require('inquirer');
const CredentialsHelper = require('./credential-file-helper.js');
let credHelper;

function confirmOverwrite (profileName) {
  return inquirer.prompt([{
    message: 'The profile already exists in your credentials file. Overwrite it?',
    type: 'confirm',
    name: 'answer',
    default: false
  }]).then((answer) => answer.answer);
}

function writeProfile (profileName) {
  return inquirer.prompt([{
    message: 'Access Key',
    type: 'input',
    name: 'aws_access_key_id'
  }, {
    message: 'Secret Key',
    type: 'password',
    name: 'aws_secret_access_key'
  }]).then((answers) => {
    answers.name = profileName;
    return credHelper.saveCredentials(answers);
  }).catch((err) => {
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


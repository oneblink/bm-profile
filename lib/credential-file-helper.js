'use strict';
const OS = require('os');
const path = require('path');
const fs = require('fs');
const credentialsParser = require('./credential-parser.js');

const CREDENTIALS_PATH = path.join(OS.homedir(), '.aws', 'credentials');

const privateVars = new WeakMap();

class CredentialsHelper {
  constructor (credentialsFilePath) {
    privateVars.set(this, {
      path: credentialsFilePath || CREDENTIALS_PATH
    });
  }

  /**
   * ~/.aws/credentials on a mac
   * %USERPROFILE%/.aws/credentials on a pc
   */
  static get DEFAULT_PATH () {
    return CREDENTIALS_PATH;
  }

  /**
   * The full path to the credentials file
   * @return {string} full path to the credentials file
   */
  get path () {
    return privateVars.get(this).path;
  }

  /**
   * Sets the path
   * @param  {string} path Full path to the credentials file
   */
  set path (p) {
    privateVars.get(this).path = p;
  }

  /**
   * is the full path to the credentials valid?
   * @return {Promise<string>} Resolves with the valid path, rejects if the path is invalid.
   */
  isValidFilePath () {
    return new Promise((resolve, reject) => {
      fs.access(this.path, (err) => {
        if (err) {
          return reject(err);
        }

        resolve(this.path);
      });
    });
  }

  profileExists (profileName) {
    return new Promise((resolve, reject) => {
      const src = fs.createReadStream(this.path);
      const transformer = credentialsParser();

      src.on('end', () => reject(new Error('Profile Not Found')));
      transformer.on('readable', () => {
        const profile = transformer.read();
        if (!profile) {
          return;
        }

        if (profile[profileName]) {
          src.removeAllListeners();
          transformer.end();
          resolve(profileName);
        }
      });

      src.pipe(transformer);
    });
  }

  saveProfile (profileName, key, secret) {
    return new Promise((resolve, reject) => {
      const profile = {
        [profileName]: {
          aws_access_key_id: key,
          aws_secret_access_key: secret
        }
      };
      const src = fs.createReadStream(this.path);
      const transformer = credentialsParser(profile);
      src.pipe(transformer); // need to implement writing.
    });
  }

  backup () {

  }
}

module.exports = CredentialsHelper;

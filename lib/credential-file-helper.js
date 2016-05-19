'use strict';
const OS = require('os');
const path = require('path');
const fs = require('fs');
const toJSON = require('./credential-parser.js').toJSON;
const toCredentials = require('./credential-parser.js').toCredentials;

const CREDENTIALS_PATH = path.join(OS.homedir(), '.aws', 'credentials');

const privateVars = new WeakMap();

/**
 * Credentials helper class
 */
class CredentialsHelper {
  /**
   * Create the helper.
   * @param  {string} credentialsFilePath path to the credentials file. defaults to "~/.aws/credentials"
   */
  constructor (credentialsFilePath) {
    privateVars.set(this, {
      path: credentialsFilePath || CREDENTIALS_PATH
    });
  }

  /**
   * '.blink-backup'
   */
  static get BACKUP_EXT () {
    return '.blink-backup';
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
   * is the path to the credentials valid?
   * @return {Promise<string>} Resolves with the valid path, rejects if the path is invalid.
   */
  isValidFilePath () {
    return new Promise((resolve, reject) => {
      fs.access(path.dirname(this.path), (err) => {
        if (err) {
          return reject(err);
        }

        resolve(this.path);
      });
    });
  }

  /**
   * Checks if a profile already exists in the helper class
   * @param  {string} profileName Name of the profile to check for
   * @return {Promise<boolean>}             Resolves with true or false, rejects on error
   */
  profileExists (profileName) {
    return new Promise((resolve, reject) => {
      const src = fs.createReadStream(this.path);
      const transformer = toJSON();

      src.on('end', () => resolve(false));
      src.on('error', (err) => reject(err));
      transformer.on('error', (err) => reject(err));
      transformer.on('readable', () => {
        const profile = transformer.read();
        if (!profile) {
          return;
        }

        if (profile.name === profileName) {
          src.removeAllListeners();
          transformer.end();
          resolve(profileName);
        }
      });

      src.pipe(transformer);
    });
  }

  saveCredentials (profile) {
    return new Promise((resolve, reject) => {
      const write = (srcPath) => {
        const dest = fs.createWriteStream(this.path);
        dest.on('finish', () => resolve(this.path));
        dest.on('error', reject);

        if (srcPath) {
          // overwriting old file that has been backed up
          const src = fs.createReadStream(srcPath);
          src.on('error', reject);
          return src.pipe(toJSON(profile)).pipe(toCredentials()).pipe(dest);
        }

        // creating new file
        const tc = toCredentials();
        tc.pipe(dest);
        tc.end(profile);
      };

      // if the file exists, back it up, else, create it.
      fs.access(this.path, (err) => {
        if (err) {
          return fs.writeFile(this.path, '', (err) => {
            if (err) {
              return reject(err);
            }

            write();
          });
        }

        this.backup().then(write).catch((err) => reject(err));
      });
    });
  }

  /**
   * backs up the current credentials file.
   * format is (this.path).<buckup number>.(CredentialsHelper.BACKUP_EXT)
   * eg ~/.aws/credentials.1.blink-backup
   * @return {Promise} Resolves with the name of the backed up file or rejects if an error happens
   */
  backup () {
    return new Promise((resolve, reject) => {
      fs.readdir(path.dirname(this.path), (err, data) => {
        if (err) {
          return reject(new Error('Credential file path could not be found')); // we should never get here, so if we do, be very loud about it.
        }
        const backupFile = this.makeBackupName(this.getNextBackupNumber(data));
        const d = path.join(path.dirname(this.path), backupFile || 1);
        const src = fs.createReadStream(this.path);
        const dest = fs.createWriteStream(d);

        dest.on('finish', () => resolve(d));
        dest.on('error', reject);
        src.on('error', reject);

        src.pipe(dest);
      });
    });
  }

  /**
   * given a list of files, it will pull out any that match CredentialsHelper.BACKUP_EXT
   * @param  {Array<string>} files a list of files, usually from fs.readdir
   * @return {Number}       The next number in the sequence
   */
  getNextBackupNumber (files) {
    const result = files.filter((filename) => path.extname(filename) === CredentialsHelper.BACKUP_EXT)
      .map((filename) => {
        const f = filename.split('.');
        return Number(f[f.length - 2]);
      })
      .sort((a, b) => a - b);

    let val = result.pop() || 0;
    return ++val;
  }

  makeBackupName (backupNumber) {
    return `${path.basename(this.path)}.${backupNumber}${CredentialsHelper.BACKUP_EXT}`;
  }
}

module.exports = CredentialsHelper;

'use strict';

const Transform = require('stream').Transform;
const util = require('util');
const os = require('os');

/**
 * A Transform Stream that reads a credentials file and converts it to an object
 * @param {object} profile a profile object
 * @param {object} options [Transform Stream Options]{@link https://nodejs.org/docs/latest-v5.x/api/stream.html#stream_new_stream_transform_options}
 */
function CredentialToJSON (profile, options) {
  options = Object.assign({ objectMode: true }, options);
  if (!(this instanceof CredentialToJSON)) {
    return new CredentialToJSON(profile, options);
  }

  if (profile) {
    this.profileName = Object.keys(profile)[0];
    this.profile = profile;
  }
  Transform.call(this, options);
}

util.inherits(CredentialToJSON, Transform);

CredentialToJSON.prototype._transform = function CredentialsTransform (chunk, encoding, done) {
  // turn the chunks into an array, then fire off an event for each profile found.
  this.chunkToArray(chunk.toString())
      .reduce(this.reducer(), [])
      .forEach(this.notifier.bind(this));
  done();
};

CredentialToJSON.prototype._flush = function CredentialsFlush (done) {
  this.profile && this.push(this.profile);
  done();
};

/**
 * Takes a chunk of data and turns it into an array of lines. If a profile is incomplete (i.e. if lines.length % numLinesInProfile !== 0)
 * then it is stored to be combined with the next chunk of data
 * @param  {string} data        The string representation of the chunk from the readable stream
 * @return {Array<string>}      An array of strings, each entry representing a line from the credentials file.
 */
CredentialToJSON.prototype.chunkToArray = function CredentialsChunkToArray (data) {
  return data.split(os.EOL).filter((line) => !!line);
};

/**
 * Returns a reducer function that groups profile entries
 * @return {Array<object>} An array of objects taking the form: {profileName: {key: value, key: value}}
 */
CredentialToJSON.prototype.reducer = function CredentialsReducer () {
  let profile, profileName;

  return (memo, line) => {
    const data = line.match(/^\[(.+)\]$/);
    if (data && data.length) {
      profileName = data[1].trim();
      profile = {
        [profileName]: {}
      };
      memo.push(profile);
    } else {
      const keyVal = line.replace(/\s/, '').split('=');
      profile[profileName][keyVal[0].trim()] = keyVal[1].trim();
    }

    return memo;
  };
};

/**
 * Notifies any listeners via this.push of any profiles that have been
 * converted to JSON. If this.profile is set and the profile name matches,
 * this.profile will be emitted
 * @param  {Object} profile The profile in JSON format
 */
CredentialToJSON.prototype.notifier = function CredentialsMapper (profile) {
  if (!this.profileName) {
    return this.push(profile);
  }
  const profileName = Object.keys(profile)[0];

  if (profileName !== this.profileName) {
    return this.push(profile);
  }

  this.push(this.profile);
  this.profile = null;
  this.profileName = null;
};

module.exports = CredentialToJSON;

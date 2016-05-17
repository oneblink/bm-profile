'use strict';

const Transform = require('stream').Transform;
const util = require('util');

/**
 * A Transform Stream that reads a credentials file and converts it to an object
 * @param {object} profile a profile object
 * @param {object} options [Transform Stream Options]{@link https://nodejs.org/docs/latest-v5.x/api/stream.html#stream_new_stream_transform_options}
 */
function CredentialParser (profile, options) {
  options = Object.assign({ objectMode: true }, options);
  if (!(this instanceof CredentialParser)) {
    return new CredentialParser(profile, options);
  }

  if (profile) {
    this.profileName = Object.keys(profile)[0];
    this.profile = profile;
  }
  Transform.call(this, options);
}

util.inherits(CredentialParser, Transform);

CredentialParser.prototype._transform = function CredentialsTransform (chunk, encoding, done) {
  // turn the chunks into an array, then fire off an event for each profile found.
  this.chunkToArray(chunk.toString())
      .reduce(this.reducer(), [])
      .map(this.mapper.bind(this));
  done();
};

/**
 * Takes a chunk of data and turns it into an array of lines. If a profile is incomplete (i.e. if lines.length % numLinesInProfile !== 0)
 * then it is stored to be combined with the next chunk of data
 * @param  {string} data        The string representation of the chunk from the readable stream
 * @return {Array<string>}      An array of strings, each entry representing a line from the credentials file.
 */
CredentialParser.prototype.chunkToArray = function CredentialsChunkToArray (data) {
  return data.replace(/\\r/g, '').split('\n').filter((line) => !!line);
};

/**
 * Returns a reducer function that groups profile entries
 * @return {Array<object>} An array of objects taking the form: {profileName: {key: value, key: value}}
 */
CredentialParser.prototype.reducer = function CredentialsReducer () {
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

CredentialParser.prototype.mapper = function CredentialsMapper (profile) {
  if (!this.profileName) {
    return this.push(profile);
  }
  const profileName = Object.keys(profile)[0];

  if (profileName !== this.profileName) {
    return this.push(profile);
  }

  this.push(this.profile);
};

module.exports = CredentialParser;

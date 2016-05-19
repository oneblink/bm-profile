'use strict';

const profileManager = require('@blinkmobile/aws-profile-management');
const profile = profileManager.profile;

const profileConfig = require('../lib/profile-config.js');

function write (profileName) {
  return profile.write(profileName)
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = function (profileName, flags, options) {
  if (profileName) {
    if (flags.set || flags.s) {
      return write(profileName)
        .then(() => profileConfig(profileName))
        .then(() => profile.show());
    }
    return write(profileName).then(() => profile.show());
  }

  profile.show();
};

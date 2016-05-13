'use strict';

const profileManager = require('@blinkmobile/aws-profile-management');
const profile = profileManager.profile;

function write (profileName) {
  return profile.write(profileName)
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = function (profileName, flags, options) {
  if (profileName) {
    return write(profileName).then(() => profile.show());
  }

  profile.show();
};

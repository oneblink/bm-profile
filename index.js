'use strict';

// foreign modules

const updateNotifier = require('update-notifier');

// local modules

const pkg = require('./package.json');

// this module
const commands = {
  profile: require('./commands/profile.js')
};

updateNotifier({ pkg }).notify();

module.exports = function (input, flags) {
  const profileName = input[0];
  if (!profileName) {
    return commands.profile();
  }

  commands.profile(profileName, flags, { cwd: process.cwd() });
};


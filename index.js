'use strict';

// foreign modules

const updateNotifier = require('update-notifier');

const isBroken = require('is-node-interactive-tty-broken').isBroken;

// local modules

const pkg = require('./package.json');

// this module
const commands = {
  profile: require('./commands/profile.js')
};

updateNotifier({ pkg }).notify();

module.exports = function (input, flags) {
  if (isBroken()) {
    console.log(`
############################################################################
The version of node that you are running has issues with TTY input. 
These issues do not negatively effect our CLI, however you are encouraged to
update your version of node.

Please upgrade to nodejs v6.2.0 or higher, or downgrade to lower than v5.6.0

############################################################################`);
  }
  const profileName = input[0];
  if (!profileName) {
    return commands.profile();
  }

  commands.profile(profileName, flags, { cwd: process.cwd() });
};


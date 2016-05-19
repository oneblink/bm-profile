'use strict';

module.exports = `
  Get or Set the name of the credentials profile used for a Blink Project, and
optionally configure the credentials.

The Credential file is automatically backed up.

Usage
=====

bm profile                    - Show the name of the current profile (defaults to 'default')
bm profile profileName        - Sets the name of the profile to use to profileName
bm profile profileName --set  - Starts an interactive prompt and then sets the key and secret for the profile
`;

#!/usr/bin/env node
'use strict';

// foreign modules

const meow = require('meow');

// local modules

const main = require('..');
const help = require('../lib/help');

// this module

const cli = meow({
  help,
  version: true
}, {
  alias: {
    c: 'config'
  }
});

main(cli.input, cli.flags);

'use strict';

const WikidotKit = require('wikidot-kit').default;

const token = process.env.WIKIDOT_TOKEN;
const wk = new WikidotKit({token});

module.exports = wk;

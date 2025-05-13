/*
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';
console.log('==== Iniciando chaincode CCV (index.js) ====');
const CCVContract = require('./lib/ccv');
module.exports.contracts = [CCVContract];

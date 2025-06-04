'use strict';

const TokenContract = require('./lib/token');
const WalletContract = require('./lib/wallet');
const TransactionContract = require('./lib/transaction');
const GovernanceContract = require('./lib/governance');

module.exports.TokenContract = TokenContract;
module.exports.WalletContract = WalletContract;
module.exports.TransactionContract = TransactionContract;
module.exports.GovernanceContract = GovernanceContract;

module.exports.contracts = [TokenContract, WalletContract, TransactionContract, GovernanceContract];

/*
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';

console.log('==== Cargando archivo CCVContract (lib/ccv.js) ====');

const { Contract } = require('fabric-contract-api');

class CCVContract extends Contract {
  constructor() {
    super();
    console.info('========= Constructor Ejecutado =========');
  }
  async initLedger(ctx) {
    console.info('========= Entrando a initLedger =========');
    console.info('Ledger initialized');
    return;
  }

  async createUser(ctx, userId, name, role) {
    console.info('========= Entrando a createUser =========');
    const user = {
      userId,
      name,
      role,
    };
    await ctx.stub.putState(userId, Buffer.from(JSON.stringify(user)));
    console.info('========= createUser completado =========');
    return JSON.stringify(user);
  }

  async getUser(ctx, userId) {
    console.info('========= Entrando a getUser =========');
    const userAsBytes = await ctx.stub.getState(userId);
    if (!userAsBytes || userAsBytes.length === 0) {
      console.error(`User ${userId} does not exist`);
      throw new Error(`User ${userId} does not exist`);
    }
    console.info('========= getUser completado =========');
    return userAsBytes.toString();
  }

  async getAllUsers(ctx) {
    console.info('========= Entrando a getAllUsers =========');
    const allResults = [];
    const iterator = await ctx.stub.getStateByRange('', '');
    let result = await iterator.next();
    while (!result.done) {
      const strValue = result.value.value.toString('utf8');
      let record;
      try {
        record = JSON.parse(strValue);
      } catch (err) {
        record = strValue;
      }
      allResults.push(record);
      result = await iterator.next();
    }
    console.info('========= getAllUsers completado =========');
    return JSON.stringify(allResults);
  }
}

module.exports = CCVContract;

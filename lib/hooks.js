const Binary = require("mongodb").Binary;
Binary.prototype.toString = function (type = null) {
  if (!type) return this;
  else {
    return this.toString(type);
  }
};
/**
 *
 * @param {string[]} encryptFields
 * @param {CallableFunction} next
 * @param {{[string]:string}} docs
 */
async function insertManyHook(encryptFields, next, docs) {
  for (const item of encryptFields) {
    for (const element of docs) {
      if (element[item]) {
        element[item] = await this.encrypt(element[item]);
      }
    }
  }

  next();
}
/**
 * @param {string[]} encryptFields
 * @param {import("mongoose").CallbackWithoutResultAndOptionalError} next
 */
async function insertHook(encryptFields, next) {
  const values = { ...this }
  for (const item of encryptFields) {
    if (values._doc[item])
      values._doc[item] = await this.encrypt(this._doc[item])
  }

  next.bind(values)()
}

/**
 *
 * @param {string[]} encryptFields
 */
async function saveHook(encryptFields) {
  for (const key in this._doc) {
    if (encryptFields.includes(key) && this._doc[key] instanceof Binary) {
      this._doc[key] = await this.decrypt(this._doc[key])
    }
  }
}
/**
 *
 * @param {string[]} encryptFields
 * @param {CallableFunction} next
 */
async function preSaveHook(encryptFields, next) {
  await insertHook.bind(this)(encryptFields, next)
  for (const key in this._doc) {
    if (encryptFields.includes(key) && this._doc[key] instanceof Binary) {
      this._doc[key] = await this.decrypt(this._doc[key])
    }
  }
}
/**
 *
 * @param {string[]} encryptFields
 * @param {{[string]:string}} res
 */
async function initHook(encryptFields, res) {
  for (const key in res) {
    if (encryptFields.includes(key) && res[key] instanceof Binary) {
      res[key] = await this.decrypt(res[key])
    }
  }
}
/**
 *
 * @param {string[]} encryptFields
 * @param {CallableFunction} next
 */

async function updateHook(encryptFields, next) {
  for (const key in this._update) {
    if (encryptFields.includes(key)) {
      this._update[key] = await this.encrypt(this._update[key])
    }
  }
  next()
}
/**
 *
 * @param {string[]} encryptFields
 * @param {object} result
 */
async function findOneHook(encryptFields, result) {
  for (const keyValue in result) {
    if (encryptFields.includes(keyValue)) {
      result[keyValue] = await this.decrypt(result[keyValue])
    }
  }
}
module.exports = {
  initHook,
  insertHook,
  updateHook,
  insertManyHook,
  preSaveHook,
  saveHook,
  findOneHook,
};

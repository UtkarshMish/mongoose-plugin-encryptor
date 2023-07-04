const {ClientEncryption} = require('mongodb-client-encryption');
const mongoose = require('mongoose');

const {
  insertManyHook,
  saveHook,
  preSaveHook,
  initHook,
  updateHook,
  findOneHook,
} = require('./hooks');
const Binary = require('mongodb').Binary;

/**
 *
 * @param {import("mongoose").Schema} schema
 * @param {import('./types').PluginProps} plugin
 */
function EncryptionPlugin(schema, plugin) {
  // use plugin extra options
  const encryptFields = [];

  const SECRET_KEY = plugin.secret;
  const connection = plugin.connection || mongoose.connection;
  const algorithm =
    plugin.algorithm || 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic';

  const keyAltName = plugin.keyAltName || 'encryption_key';
  const keyVaultNamespace = plugin.keyVaultNamespace || 'encryption.__keyVault';
  const kmsProviders = {
    local: {
      key: SECRET_KEY,
    },
  };

  let key = null;

  // get encrypted fields
  schema.eachPath((path, type) =>
    type.options?.encrypted ? encryptFields.push(path) : null,
  );

  async function encrypt(value) {
    const client = connection.getClient();
    const clientEncryption = new ClientEncryption(client, {
      keyVaultNamespace,
      kmsProviders,
    });

    if (key == null) {
      const [dbName, collectionName] = keyVaultNamespace.split('.');
      // check if key already exist
      const keyObject = await client
        .db(dbName)
        .collection(collectionName)
        .findOne({keyAltNames: {$in: [keyAltName]}});

      // if key doesn't exist, create new one
      key = keyObject
        ? keyObject._id
        : await clientEncryption.createDataKey('local', {
            keyAltNames: [keyAltName],
          });
    }

    if (
      value instanceof Binary ||
      typeof value === 'number' ||
      typeof value == 'boolean' ||
      value == null
    ) {
      return value;
    } else if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index++) {
        value[index] = await encrypt(value[index]);
      }
      return value;
    } else if (isObject(value)) {
      for (const keyValue in value) {
        value[keyValue] = await encrypt(value[keyValue]);
      }
      return value;
    } else {
      const encryptedValue = await clientEncryption.encrypt(value, {
        keyId: key,
        algorithm: algorithm,
      });
      encryptedValue.toString = function () {
        return encryptedValue;
      };
      return encryptedValue;
    }
  }

  async function decrypt(value) {
    const client = connection.getClient();
    const clientEncryption = new ClientEncryption(client, {
      keyVaultNamespace,
      kmsProviders,
    });
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index++) {
        value[index] = await decrypt(value[index]);
      }
      return value;
    } else if (isObject(value)) {
      for (const keyValue in value) {
        value[keyValue] = await decrypt(value[keyValue]);
      }
      return value;
    } else if (value instanceof Binary) return clientEncryption.decrypt(value);
    else return value;
  }

  // implemented hooks for save, insert, find, update
  schema.pre('save', async function (next) {
    await preSaveHook.bind({...this, encrypt, decrypt})(encryptFields, next);
  });
  schema.post('save', async function () {
    await saveHook.bind({...this, encrypt, decrypt})(encryptFields);
  });
  schema.pre('insertMany', async function (next, docs) {
    await insertManyHook.bind({...this, encrypt, decrypt})(
      encryptFields,
      next,
      docs,
    );
  });
  schema.pre('init', async function (res) {
    await initHook.bind({...this, encrypt, decrypt})(encryptFields, res);
  });

  schema.pre('updateOne', async function (next) {
    await updateHook.bind({...this, encrypt, decrypt})(encryptFields, next);
  });
  schema.post('findOne', async function (result) {
    await findOneHook.bind({...this, encrypt, decrypt})(encryptFields, result);
  });
  async function handleFind(result) {
    if (result && Array.isArray(result)) {
      for (const element of result) {
        await findOneHook.bind({...this, encrypt, decrypt})(
          encryptFields,
          element,
        );
      }
    }
  }
  schema.post('find', handleFind);
  schema.post('findMany', handleFind);

  schema.encrypt = encrypt;
  schema.decrypt = decrypt;
}

/**
 *
 * @param {object} value
 * @returns {boolean}
 */
function isObject(value) {
  return (
    typeof value == 'object' &&
    value instanceof Object &&
    !(value instanceof Binary)
  );
}

module.exports = {
  EncryptionPlugin,
};

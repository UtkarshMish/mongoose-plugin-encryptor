# mongoose-plugin-encryptor

[![npm version](https://badge.fury.io/js/mongoose-plugin-encryptor.svg)](https://badge.fury.io/js/mongoose-plugin-encryptor) [![GitHub license](https://img.shields.io/github/license/UtkarshMish/mongoose-plugin-encryptor.svg)](https://github.com/UtkarshMish/mongoose-plugin-encryptor/blob/master/LICENSE)

Provides Client Side field encryption to mongoose documents as a plugin to schemas. It depends on the mongodb `mongodb-client-encryption` package.

Encryption and decryption of data happens natively during `save`, `find` and `upate`.

## How it Works

Encryption is performed using `AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic` by default, user can define another random algorithm supported by mongodb-client-encryption i.e `AEAD_AES_256_CBC_HMAC_SHA_512-Random`.

To encrypt, the fields that are marked are automatically encrypted using `save` or `insert` or `insertMany` and decrypted when using `find`, `findMany`, `findOne`, additionally it provides encrypt and decrypt methods to handle it explicitly.

## Installation

`npm install mongoose-plugin-encryptor`

## Usage

- Generate and store 96 byte random hex as a secret and mention secret in the option.
- Use `Buffer.from(SECRET,"hex")` to set secret in plugin option
- Mark fields that are encrypted as `encrypted: true` to notify plugin that field is encrypted

### Basic

Fields are encrypted when it has property `encrypted:true`, except for `_id`, `__v`, as well as fields having `boolean` or `number` values.

```[javascript]
const mongoose = require('mongoose');
const {EncryptionPlugin} = require('mongoose-plugin-encryptor');

const userSchema = new mongoose.Schema({
    name: {
      type: String,
      encrypted: true // to make name as Encrypted Field
    },
    age: {
      type: Number,
      required: true
    }
    // ... other properties
});


userSchema.plugin(EncryptionPlugin, {
  secret: Buffer.from(process.env.SECRET,"hex"), // set it in environment variable as hex string

  algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic", // algorithm for encrypting field

  keyAltName: "encryption_key", // name of the key

  keyVaultNamespace: "encryption.__keyVault", // dbname.collection to store encryption keys

 });

User = mongoose.model('User', userSchema);

```

And you're all set for it to use. `find`,`findOne`, `findById`, works natively as well as `save` and `update` also works as normal.

### Nested Fields

Nested fields are automatically encrypted if the object is marked to be encrypted

## How to Run Unit Tests

1. Install dependencies with `npm install`
2. Start mongo with `mongod`
3. Run tests with `npm test`

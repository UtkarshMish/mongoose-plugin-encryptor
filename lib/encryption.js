const crypto = require('crypto');

function encryptorFunction(value, SECRET) {
	const cipher = crypto.createCipher('aes-256-gcm', SECRET);
	return cipher.update(value, 'utf-8', 'hex') + cipher.final('hex');
}

function decryptorFunction(value, SECRET) {
	const decipher = crypto.createDecipher('aes-256-gcm', SECRET);
	return decipher.update(value, 'hex').toString('utf-8');
}

module.exports = {
	encryptorFunction,
	decryptorFunction
};

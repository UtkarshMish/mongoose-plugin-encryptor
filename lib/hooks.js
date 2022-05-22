const Binary = require('mongodb').Binary;
const {decryptorFunction, encryptorFunction} = require('./encryption');
class BinaryClass {
	constructor(value) {
		this.value = new Binary(value, 6);
	}
	toString() {
		return this.value;
	}
}
/**
 *
 * @param {string} SECRET_KEY
 * @param {string[]} encryptFields
 * @param {CallableFunction} next
 * @param {{[string]:string}} docs
 */
function insertManyHook(SECRET_KEY, encryptFields, next, docs) {
	docs.forEach(element => {
		Object.keys(element).forEach(keys => {
			if (encryptFields.includes(keys)) {
				element[keys] = new BinaryClass(
					encryptorFunction(element[keys], SECRET_KEY),
					6
				);
			}
		});
	});
	next();
}
/**
 * @param {string} SECRET_KEY
 * @param {string[]} encryptFields
 * @param {import("mongoose").CallbackWithoutResultAndOptionalError} next
 */
function insertHook(SECRET_KEY, encryptFields, next) {
	const values = {...this};
	encryptFields.forEach(item => {
		values._doc[item] = new Binary(
			encryptorFunction(this._doc[item], SECRET_KEY),
			6
		);
	});
	next.bind(values)();
}

/**
 *
 * @param {string} SECRET_KEY
 * @param {string[]} encryptFields
 */
function saveHook(SECRET_KEY, encryptFields) {
	Object.keys(this._doc).forEach(key => {
		if (encryptFields.includes(key) && this[key] instanceof Binary) {
			this[key] = decryptorFunction(this[key].toString('utf-8'), SECRET_KEY);
		}
	});
}
/**
 *
 * @param {string} SECRET_KEY
 * @param {string[]} encryptFields
 * @param {CallableFunction} next
 */
function preSaveHook(SECRET_KEY, encryptFields, next) {
	insertHook.bind(this)(SECRET_KEY, encryptFields, next);
	encryptFields.forEach(item => {
		if (this[item]) {
			this[item] = decryptorFunction(this[item], SECRET_KEY);
		}
	});
}
/**
 *
 * @param {string} SECRET_KEY
 * @param {string[]} encryptFields
 * @param {{[string]:string}} res
 */
function initHook(SECRET_KEY, encryptFields, res) {
	Object.keys(this._doc).forEach(key => {
		if (encryptFields.includes(key)) {
			this[key] = decryptorFunction(res[key], SECRET_KEY);
		}
	});
}
/**
 *
 * @param {string} SECRET_KEY
 * @param {string[]} encryptFields
 * @param {CallableFunction} next
 */

function updateHook(SECRET_KEY, encryptFields, next) {
	encryptFields.forEach(item => {
		if (this._update[item]) {
			this._update[item] = new BinaryClass(
				encryptorFunction(this._update[item], SECRET_KEY),
				6
			);
		}
	});
	next();
}
module.exports = {
	initHook,
	insertHook,
	updateHook,
	insertManyHook,
	preSaveHook,
	saveHook
};

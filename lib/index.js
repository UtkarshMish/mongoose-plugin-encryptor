const {
	insertManyHook,
	saveHook,
	preSaveHook,
	initHook,
	updateHook
} = require('./hooks');

/**
 *
 * @param {import("mongoose").Schema} schema
 * @param {import("mongoose").Model} plugin
 */
function EncryptionPlugin(schema, plugin) {
	const SECRET_KEY = plugin.secret;
	const encryptFields = [];
	schema.eachPath((path, type) =>
		type.options?.encrypted ? encryptFields.push(path) : null
	);
	schema.pre('save', function (next) {
		preSaveHook.bind(this)(SECRET_KEY, encryptFields, next);
	});
	schema.post('save', function () {
		saveHook.bind(this)(SECRET_KEY, encryptFields);
	});
	schema.pre('insertMany', function (next, docs) {
		insertManyHook.bind(this)(SECRET_KEY, encryptFields, next, docs);
	});
	schema.post('init', function (res) {
		initHook.bind(this)(SECRET_KEY, encryptFields, res);
	});

	schema.pre('updateOne', function (next) {
		updateHook.bind(this)(SECRET_KEY, encryptFields, next);
	});
}

module.exports = {
	EncryptionPlugin
};

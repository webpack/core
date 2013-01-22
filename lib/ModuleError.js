/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
function ModuleError(err) {
	Error.call(this);
	Error.captureStackTrace(this, ModuleError);
	this.name = "ModuleError";
	this.message = err;
	this.error = err;
}
module.exports = ModuleError;

ModuleError.prototype = Object.create(Error.prototype);

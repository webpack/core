/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
function ModuleBuildError(module, err) {
	Error.call(this);
	Error.captureStackTrace(this, ModuleBuildError);
	this.name = "ModuleBuildError";
	this.message = "Module build failed: " + err.toString();
	this.module = module;
	this.error = err;
}
module.exports = ModuleBuildError;

ModuleBuildError.prototype = Object.create(Error.prototype);

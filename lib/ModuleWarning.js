/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
function ModuleWarning(warning) {
	Error.call(this);
	Error.captureStackTrace(this, ModuleWarning);
	this.name = "ModuleWarning";
	this.message = warning;
	this.warning = warning;
}
module.exports = ModuleWarning;

ModuleWarning.prototype = Object.create(Error.prototype);

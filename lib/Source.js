/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
function Source() {
	this._result = null;
}
module.exports = Source;

Source.prototype.source = function() {
	if(!this._result)
		this._result = this._bake();
	return this._result.source;
};
Source.prototype.size = function() {
	if(!this._result)
		this._result = this._bake();
	return this._result.source.length;
};
Source.prototype.map = function() {
	if(!this._result)
		this._result = this._bake();
	return this._result.map;
};
Source.prototype.origins = function() {
	if(!this._result)
		this._result = this._bake();
	return this._result.origins;
};
Source.prototype.updateHash = function(hash) {
	if(!this._result)
		this._result = this._bake();
	hash.update(this._result.source || "");
	// TODO
	// hash.update(this._result.map || "");
	// hash.update(this._result.origins || "");
};

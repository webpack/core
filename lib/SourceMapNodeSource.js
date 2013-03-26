/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var Source = require("./Source");

function SourceMapNodeSource(node, name) {
	Source.call(this);
	this._node = node;
	this._name = name;
}
module.exports = SourceMapNodeSource;

SourceMapNodeSource.prototype = Object.create(Source.prototype);
SourceMapNodeSource.prototype._bake = function() {
	var result = this._node.toStringWithSourceMap({
		file: this._name
	});
	return {
		source: result.code,
		map: result.map.toJSON(),
		node: this._node
	};
};
SourceMapNodeSource.prototype.node = function() {
	return this._node;
}
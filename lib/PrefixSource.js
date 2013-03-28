/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var SourceMapNodeSource = require("./SourceMapNodeSource");
var SourceNode = require("source-map").SourceNode;

function PrefixSource(prefix, source) {
	var node = source.node();
	node = new SourceNode(null, null, null, [
		prefix,
		this._cloneAndReplace(node, /\n/g, "\n" + prefix)
	]);
	SourceMapNodeSource.call(this, node);
}
module.exports = PrefixSource;

PrefixSource.prototype = Object.create(SourceMapNodeSource.prototype);
PrefixSource.prototype._cloneAndReplace = function cloneAndReplace(node, regExp, replacement) {
	if(typeof node === "string") {
		return node.replace(regExp, replacement);
	} else {
		var newNode = new SourceNode(
			node.line,
			node.column,
			node.source,
			node.children.map(function(node) {
				return cloneAndReplace(node, regExp, replacement);
			}),
			node.name
		);
		node.walkSourceContents(function(file, content) {
			newNode.setSourceContent(file, content);
		});
		return newNode;
	}
};

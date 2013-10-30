/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var SourceNode = require("source-map").SourceNode;
var SourceMapConsumer = require("source-map").SourceMapConsumer;
var SourceMapNodeSource = require("./SourceMapNodeSource");

function isSplitter(c) {
	switch(c) {
	case 10: // \n
	case 13: // \r
	case 59: // ;
	case 123: // {
	case 125: // }
	return true;
	}
	return false;
}
function _splitCode(code) {
	var result = [];
	var i = 0, j = 0;
	for(; i < code.length; i++) {
		if(isSplitter(code.charCodeAt(i))) {
			while(isSplitter(code.charCodeAt(++i)));
			result.push(code.substring(j, i));
			j = i;
		}
	}
	if(j < code.length)
		result.push(code.substr(j));
	return result;
}

function OriginalSource(value, name, sourceMap) {
	var lines = value.split("\n");
	var node = new SourceNode(null, null, null,
		lines.map(function(line, idx) {
			var pos = 0;
			return new SourceNode(null, null, null,
				_splitCode(line + (idx != lines.length-1 ? "\n" : "")).map(function(item) {
					var res = new SourceNode(idx+1, pos, name, item);
					pos += item.length;
					return res;
				})
			);
		})
	);
	node.setSourceContent(name, value);
	if(sourceMap) {
		sourceMap = new SourceMapConsumer(sourceMap);
		var result = node.toStringWithSourceMap({
			file: "?"
		});
		result.map.applySourceMap(sourceMap, name);
		node = SourceNode.fromStringWithSourceMap(result.code, new SourceMapConsumer(result.map.toJSON()));
	}
	SourceMapNodeSource.call(this, node, name);
	this._value = value;
}

module.exports = OriginalSource;

OriginalSource.prototype = Object.create(SourceMapNodeSource.prototype);
OriginalSource.prototype.source = function() {
	return this._value;
};
OriginalSource.prototype.updateHash = function(hash) {
	hash.update(this._value);
	hash.update(this._name);
};

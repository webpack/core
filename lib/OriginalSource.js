/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var SourceNode = require("source-map").SourceNode;
var SourceMapConsumer = require("source-map").SourceMapConsumer;
var Source = require("./Source");

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
	Source.call(this);
	this._value = value;
	this._name = name;
	if(typeof sourceMap === "string")
		sourceMap = JSON.parse(sourceMap);
	this._sourceMap = sourceMap;
}

module.exports = OriginalSource;

OriginalSource.prototype = Object.create(Source.prototype);
OriginalSource.prototype.constructor = OriginalSource;

OriginalSource.prototype.source = function() {
	return this._value;
};

OriginalSource.prototype.map = function(options) {
	return this.node(options).toStringWithSourceMap({ file: "x" }).map.toJSON();
};

OriginalSource.prototype.sourceAndMap = function(options) {
	var res = this.node(options).toStringWithSourceMap({file:"x"});
	return {
		source: res.code,
		map: res.map.toJSON()
	};
};

OriginalSource.prototype.node = function(options) {
	var sourceMap = this._sourceMap;
	var value = this._value;
	var name = this._name;
	if(sourceMap) {
		node = SourceNode.fromStringWithSourceMap(value, new SourceMapConsumer(sourceMap));
	} else {
		var lines = value.split("\n");
		var node = new SourceNode(null, null, null,
			lines.map(function(line, idx) {
				var pos = 0;
				return new SourceNode(null, null, null,
					_splitCode(line + (idx != lines.length-1 ? "\n" : "")).map(function(item) {
						if(/^\s*$/.test(item)) return item;
						var res = new SourceNode(idx+1, pos, name, item);
						pos += item.length;
						return res;
					})
				);
			})
		);
		node.setSourceContent(name, value);
	}
	return node;
};

OriginalSource.prototype.updateHash = function(hash) {
	hash.update(this._value);
	hash.update(this._name);
	if(typeof this._sourceMap === "object")
		hash.update(this._sourceMap.mappings);
};

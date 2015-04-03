/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var SourceNode = require("source-map").SourceNode;
var Source = require("./Source");

function CheapOriginalSource(value, name) {
	Source.call(this);
	this._value = value;
	this._name = name;
}

module.exports = CheapOriginalSource;

CheapOriginalSource.prototype = Object.create(Source.prototype);
CheapOriginalSource.prototype.constructor = CheapOriginalSource;

CheapOriginalSource.prototype.source = function() {
	return this._value;
};

CheapOriginalSource.prototype.map = function(options) {
	return this.node(options).toStringWithSourceMap({ file: "x" }).map.toJSON();
};

CheapOriginalSource.prototype.sourceAndMap = function(options) {
	var res = this.node(options).toStringWithSourceMap({file:"x"});
	return {
		source: res.code,
		map: res.map.toJSON()
	};
};

CheapOriginalSource.prototype.node = function(options) {
	var name = this._name;
	var lines = this._value.split("\n");
	var node = new SourceNode(null, null, null,
		lines.map(function(line, idx) {
			var pos = 0;
			return new SourceNode(idx+1, 0, name,
				(line + (idx != lines.length-1 ? "\n" : ""))
			);
		})
	);
};

CheapOriginalSource.prototype.updateHash = function(hash) {
	hash.update(this._value);
	hash.update(this._name);
};

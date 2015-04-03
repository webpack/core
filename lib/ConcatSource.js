/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var Source = require("./Source");
var SourceNode = require("source-map").SourceNode;

function ConcatSource() {
	Source.call(this);
	this.children = Array.prototype.slice.call(arguments);
}
module.exports = ConcatSource;

ConcatSource.prototype = Object.create(Source.prototype);
ConcatSource.prototype.constructor = ConcatSource;

ConcatSource.prototype.add = function(item) {
	this.children.push(item);
};

ConcatSource.prototype.source = function() {
	return this.children.map(function(item) {
		return typeof item === "string" ? item : item.source();
	}).join("");
};

ConcatSource.prototype.size = function() {
	return this.children.map(function(item) {
		return typeof item === "string" ? item.length : item.size();
	}).reduce(function(sum, s) { return sum + s; }, 0);
};

ConcatSource.prototype.node = function(options) {
	var node = new SourceNode(null, null, null, this.children.map(function(item) {
		return typeof item === "string" ? item : item.node();
	}));
	return node;
};

ConcatSource.prototype.sourceAndMap = function(options) {
	var res = this.node(options).toStringWithSourceMap({file:"x"});
	return {
		source: res.code,
		map: res.map.toJSON()
	};
};

ConcatSource.prototype.map = function(options) {
	return this.node(options).toStringWithSourceMap({ file: "x" }).map.toJSON();
};

ConcatSource.prototype.updateHash = function(hash) {
	this.children.forEach(function(item) {
		item.updateHash(hash);
	});
};

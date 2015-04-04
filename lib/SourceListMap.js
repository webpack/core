/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var base64VLQ = require("./base64-vlq")

function getNumberOfLines(str) {
	var nr = -1;
	var idx = -1;
	do {
		nr++
		idx = str.indexOf("\n", idx + 1);
	} while(idx >= 0);
	return nr;
}

function SourceListNode(generatedCode, source, originalSource) {
	this.generatedCode = generatedCode;
	this.originalSource = originalSource;
	this.source = source;
}
exports.SourceListNode = SourceListNode;

SourceListMap.prototype.clone = function() {
	return new SourceListNode(this.generatedCode, this.source, this.originalSource);
}

var LINE_MAPPING = "AACA;";
var LAST_LINE_MAPPING = "AACA";

SourceListNode.prototype.getMappings = function(mappingsContext) {
	var lines = getNumberOfLines(this.generatedCode);
	if(this.source) {
		var sourceIdx = mappingsContext.ensureSource(this.source, this.originalSource);
		var mappings = "A"; // column 0
		mappings += base64VLQ.encode(sourceIdx - mappingsContext.currentSource); // source index
		mappings += base64VLQ.encode(1 - mappingsContext.currentOriginalLine); // line index
		mappings += "A";
		if(lines !== 0)
			mappings += ";"
		mappingsContext.currentSource = sourceIdx;
		mappingsContext.currentOriginalLine = lines || 1;
		mappings += Array(lines).join(LINE_MAPPING);
		if(lines !== 0 && this.generatedCode[this.generatedCode.length - 1] !== "\n") {
			mappings += LAST_LINE_MAPPING;
			mappingsContext.currentOriginalLine++;
		}
	} else {
		var mappings = Array(lines+1).join(";");
	}
	return mappings;
};

function MappingsContext() {
	this.sources = [];
	this.sourcesContent = [];
	this.currentOriginalLine = 1;
	this.currentSource = 0;
}
exports.MappingsContext = MappingsContext;

MappingsContext.prototype.ensureSource = function(source, originalSource) {
	var idx = this.sources.indexOf(source);
	if(idx >= 0)
		return idx;
	idx = this.sources.length;
	this.sources.push(source);
	this.sourcesContent.push(originalSource);
	return idx;
};

function SourceListMap(generatedCode, source, originalSource) {
	this.children = [];
	if(generatedCode || source)
		this.add(new SourceListNode(generatedCode, source, originalSource));
}
exports.SourceListMap = SourceListMap;

function toSourceListNode(source) {
	if(typeof source === "string")
		return new SourceListNode(source)
	else
		return source;
}

SourceListMap.prototype.add = function(source) {
	if(this.children.length > 0 && !this.children[this.children.length - 1].source) {
		this.children[this.children.length - 1].generatedCode += source;
	} else {
		this.children.push(toSourceListNode(source));
	}
};

SourceListMap.prototype.addListMap = function(lm) {
	lm.children.forEach(function(sln) {
		this.children.push(sln);
	}, this);
};

SourceListMap.prototype.preprend = function(source) {
	if(this.children.length > 0 && !this.children[0].source) {
		this.children[0].generatedCode = source + this.children[0].generatedCode;
	} else {
		this.children.unshift(toSourceListNode(source));
	}
};

SourceListMap.prototype.preprendListMap = function(lm) {
	lm.children.forEach(function(sln) {
		this.children.unshift(sln);
	}, this);
};

SourceListMap.prototype.mapGeneratedCode = function(fn) {
	this.children.forEach(function(sln) {
		sln.generatedCode = fn(sln.generatedCode);
	});
};

SourceListMap.prototype.toString = function() {
	return this.children.map(function(sln) {
		return sln.generatedCode;
	}).join("");
};

SourceListMap.prototype.toStringWithSourceMap = function() {
	var mappingsContext = new MappingsContext();
	var source = this.children.map(function(sln) {
		return sln.generatedCode;
	}).join("");
	var mappings = this.children.map(function(sln) {
		return sln.getMappings(mappingsContext);
	}).join("");
	return {
		source: source,
		map: {
			version: 3,
			sources: mappingsContext.sources,
			sourcesContent: mappingsContext.sourcesContent,
			mappings: mappings
		}
	};
}

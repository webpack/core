/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var RawSource = require("./RawSource");
var path = require("path");

var ModuleBuildError = require("./ModuleBuildError");
var ModuleError = require("./ModuleError");
var ModuleWarning = require("./ModuleWarning");

function NormalModuleMixin(request, preLoaders, postLoaders) {
	var splittedRequest = request.split("!");
	this.resource = splittedRequest.pop();
	this.loaders = splittedRequest;
	var resourcePath = this.splitQuery(this.resource)[0];
	this.context = resourcePath && path.dirname(resourcePath);
	this.request = request;
	this.preLoaders = preLoaders;
	this.postLoaders = postLoaders;
	this.fileDependencies = [];
	this.contextDependencies = [];
}
module.exports = NormalModuleMixin;

NormalModuleMixin.mixin = function(pt) {
	for(var name in NormalModuleMixin.prototype)
		pt[name] = NormalModuleMixin.prototype[name];
};

NormalModuleMixin.prototype.splitQuery = function splitQuery(req) {
	var i = req.indexOf("?");
	if(i < 0) return [req, ""];
	return [req.substr(0, i), req.substr(i)];
};

NormalModuleMixin.prototype.build = function(options, resolver, fs, callback) {
	var splitQuery = this.splitQuery.bind(this);

	// Prepare context
	var loaders = [];
	function addLoaderToList(loader) {
		var l = splitQuery(loader);
		loaders.push({
			request: loader,
			path: l[0],
			query: l[1],
			module: null
		});
	}
	this.preLoaders.forEach(addLoaderToList);
	this.loaders.forEach(addLoaderToList);
	this.postLoaders.forEach(addLoaderToList);
	var loaderContext = {
		version: 1,
		context: this.context,
		loaders: loaders,
		loaderIndex: 0,
		resource: this.resource,
		resourcePath: splitQuery(this.resource)[0],
		resourceQuery: this.resource ? splitQuery(this.resource)[1] : null,
		emitWarning: function(warning) {
			this.warnings.push(new ModuleWarning(warning));
		}.bind(this),
		emitError: function(error) {
			this.errors.push(new ModuleError(error));
		}.bind(this),
		resolve: function(context, request, callback) {
			resolver.resolve(context, request, callback);
		},
		resolveSync: function(context, request, callback) {
			return resolver.resolveSync(context, request);
		},
		addDependency: function(file) {
			this.fileDependencies.push(file);
		}.bind(this),
		addContextDependency: function(context) {
			this.contextDependencies.push(context);
		}.bind(this),
		clearDependencies: function() {
			this.fileDependencies.length = 0;
			this.contextDependencies.length = 0;
		}.bind(this),
		options: options,
		debug: options.debug,
	};
	this.fillLoaderContext(loaderContext, options);
	if(options.loader) for(var key in options.loader)
		loaderContext[key] = options.loader[key];


	function runSyncOrAsync(fn, context, args, callback) {
		var isSync = true;
		var isDone = false;
		var isError = false; // internal error
		context.async = function() {
			if(isDone) throw new Error("async(): The callback was already called.");
			isSync = false;
			return context.callback;
		};
		context.callback = function() {
			if(isDone) throw new Error("callback(): The callback was already called.");
			isDone = true;
			isSync = false;
			try {
				callback.apply(null, arguments);
			} catch(e) {
				isError = true;
				throw e;
			}
		};
		try {
			var result = fn.apply(context, args);
			if(isSync) {
				isDone = true;
				if(result === undefined)
					return callback();
				return callback(null, result);
			}
		} catch(e) {
			if(isError) throw e;
			if(isDone) {
				// loader is already "done", so we cannot use the callback function
				// for better debugging we print the error on the console
				if(typeof e === "object" && e.stack) console.error(e.stack);
				else console.error(e);
				return;
			}
			isDone = true;
			callback(e);
		}

	}

	// Load and pitch loaders
	(function loadPitch() {
		var l = loaderContext.loaders[loaderContext.loaderIndex];
		if(!l) {
			return onLoadPitchDone.call(this);
		}
		if(l.module) {
			loaderContext.loaderIndex++;
			return loadPitch.call(this);
		}
		if(require.supportQuery) {
			l.module = require(l.request);
		} else {
			l.module = require(l.path);
		}
		if(typeof l.module !== "function")
			return callback(new Error("Loader " + l.request + " didn't returned a function"));
		var remaining = [];
		for(var i = loaderContext.loaderIndex; i < loaderContext.loaders.length; i++)
			remaining.push(loaderContext.loaders[i].request);
		remaining.push(loaderContext.resource);
		if(typeof l.module.pitch !== "function") return loadPitch.call(this);
		runSyncOrAsync(l.module.pitch, loaderContext, [remaining.join("!"), l.data = {}], function(err) {
			if(err) return onModuleBuildFailed.call(this, err);
			var args = Array.prototype.slice.call(arguments, 1);
			if(args.length > 0) {
				onModuleBuild.apply(this, args);
			} else {
				loadPitch.call(this);
			}
		}.bind(this));
	}.call(this));


	function onLoadPitchDone() {
		loaderContext.loaderIndex++;
		var resourcePath = loaderContext.resourcePath;
		if(resourcePath) {
			loaderContext.addDependency(resourcePath);
			fs.readFile(resourcePath, nextLoader.bind(this));
		} else
			nextLoader.call(this, null, null);
	}

	function nextLoader(err/*, paramBuffer1, paramBuffer2, ...*/) {
		var args = Array.prototype.slice.apply(arguments, 1);
		if(err) {
			// a loader emitted an error
			return onModuleBuildFailed.call(this, err);
		}
		if(loaderContext.loaderIndex === 0) {
			if(Buffer.isBuffer(args[0]))
				args[0] = args[0].toString("utf-8");
			return onModuleBuild.apply(this, args);
		}
		loaderContext.loaderIndex--;
		var l = loaderContext.loaders[loaderContext.loaderIndex];
		loaderContext.data = l.data;
		if(!l.module.raw && Buffer.isBuffer(args[0])) {
			args[0] = args[0].toString("utf-8");
		} else if(l.module.raw && typeof args[0] === "string") {
			args[0] = new Buffer(args[0], "utf-8");
		}
		runSyncOrAsync(l.module, loaderContext, args, nextLoader);
	}


	function onModuleBuild(source) {
		this._source = new RawSource(source);
		return callback();
	}

	function onModuleBuildFailed(err) {
		this.error = err;
		return callback(err);
	}
};

NormalModuleMixin.prototype.fillLoaderContext = function fillLoaderContext() {};

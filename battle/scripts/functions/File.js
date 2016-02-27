"use strict";

const File = {
	loadFileOfType : function (_store, object, loadEvent, dataForFile, directory, filetype, _paths, uponLoad, uponError, _redirectedPaths) {
		var store = _store;
		if (!Files.hasOwnProperty(store))
			Files[store] = {};
		var substore = store;
		store = Files[store];
		var paths = wrapArray(_paths);
		var redirectedPaths = _redirectedPaths || [];
		var path = paths.shift();
		if (/(.*)\.(\w+)/.test(path))
			path = path.match(/(.*)\.(\w+)/)[1];
		var successful = function (data, uponLoadObject) {
			foreach(redirectedPaths.concat(path), function (redirect) {
				store[redirect] = data;
			});
			if (uponLoadObject && uponLoadObject.uponLoad !== null) {
				uponLoadObject.uponLoad(data);
				uponLoadObject.uponLoad = null;
			}
		};
		if (store.hasOwnProperty(path)) {
			if (!store[path].hasOwnProperty("uponLoad")) {
				successful(store[path], uponLoad ? { uponLoad : uponLoad } : null);
				return store[path];
			} else { // A file is already scheduled to be loaded, but hasn't finished loading yet
				if (uponLoad) {
					store[path].uponLoad = function (oldUponLoad) { return function (data) {
						if (oldUponLoad)
							oldUponLoad(data);
						uponLoad(data);
					}; }(store[path].uponLoad);
				}
				return null;
			}
		}
		var errorResponse = function (message, url, line) {
			Files.nonexistent.pushIfNotAlreadyContained(path);
			delete store[path];
			redirectedPaths.push(path);
			if (paths.notEmpty()) {
				File.loadFileOfType(substore, object, loadEvent, dataForFile, directory, filetype, paths, uponLoad, uponError, redirectedPaths);
				return true;
			} else
				return uponError ? uponError(redirectedPaths, message) : false;
		};
		if (Files.nonexistent.contains(path)) {
			errorResponse("Nonexistent file-path: " + path);
		} else {
			var file = new object(), uponLoadObject = {
				uponLoad : uponLoad ? uponLoad : null
			};
			file.addEventListener(loadEvent, function (event) {
				successful(dataForFile(event, file, store, path), uponLoadObject);
			});
			file.addEventListener("error", errorResponse);
			var suffix =  path.match(/\?.*$/);
			file.src = (!(path.substr(0, 5) === "data:" || path.substr(0, 5) === "http:" || path.substr(0, 6) === "https:") ? (directory ? directory + "/" : "") + (path.replace(/\?.*$/, "") + "." + filetype + (suffix !== null ? suffix[0] : "")) : path);
			store[path] = uponLoadObject;
		}
		return null;
	},
	load : function (_paths, uponLoad, uponError) {
		// Uses the first file to check what data it contains
		// E.g. if the first file is a PNG, then Sprite.load will be used for all the files
		var paths = wrapArray(_paths);
		var filetype = paths[0].match(/\.(\w+)$/);
		if (filetype === null) {
			if (typeof uponError !== "undefined") {
				console.log(uponError, typeof uponError);
				uponError(paths[0], "The supplied file (" + paths[0] + ") had no filtype.");
			}
			return null;
		}
		switch (filetype[1]) {
			case "png":
				return Sprite.load(paths, uponLoad, uponError, filetype[1]);
			case "mp3":
			case "ogg":
				return Sound.load(paths, uponLoad, uponError, filetype[1]);
			default:
				uponError(paths, "The supplied file (" + paths[0] + ") had an unsupported filtype.");
				break;
		}
	}
};
const Files = {
	nonexistent : []
};
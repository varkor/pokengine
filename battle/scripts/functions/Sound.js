"use strict";

const Sound = {
	load : function (_paths, uponLoad, uponError, filetype, playImmediately) {
		var paths = wrapArray(_paths).slice(0), filetype = arguments.length >= 4 && typeof _filetype !== "undefined" ? _filetype : null;
		if (filetype === null) {
			var filetypeMatch = paths[0].replace(/\{.*\}/, "").match(/\.[a-z0-9]+$/i);
			if (filetypeMatch) {
				filetype = filetypeMatch[0].slice(1);
				foreach(paths, function (path, i) {
					paths[i] = paths[i].replace("." + filetype, "");
				});
			} else {
				filetype = "mp3";
			}
		}
		if (typeof Cache === "object" && Cache !== null) {
			foreach(paths, function (path, i) {
				paths[i] = paths[i].replace("{cache}", Cache.getURL(paths[i] + "." + filetype, null, true));
			});
		}
		return File.loadFileOfType("sounds", Audio, "canplaythrough", function (event, sound, store, path) {
			var data = {
				sound : sound
			};
			if (playImmediately && Settings._("sound effects"))
				sound.play();
			store[path] = data;
			return store[path];
		}, Settings._("paths => sounds"), filetype, paths, uponLoad, uponError);
	},
	play : function (paths, uponError, filetype) {
		if (Settings._("sound effects")) {
			Sound.load(paths, function (soundObject) {
				soundObject.sound.currentTime = 0;
				soundObject.sound.play();
			}, uponError, filetype, true);
		}
	}
};
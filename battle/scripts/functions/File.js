File = {
	load : function (store, object, loadEvent, uponLoad, directory, filetype, paths, alias, external, uponError) {
		if (!Files.hasOwnProperty(store))
			Files[store] = {};
		store = Files[store];
		paths = wrapArray(paths);
		var path = paths.shift();
		alias = alias || path;
		if (store.hasOwnProperty(alias))
			return store[alias];
		else if (store.hasOwnProperty(path)) {
			store[alias] = store[path];
			return store[alias];
		}
		var file = new object();
		file.src = (!(external || path.substr(0, 5) === "data:") ? directory + "/" + path + "." + filetype : path);
		store[alias] = store[path] = null;
		file.addEventListener(loadEvent, function (event) {
			uponLoad(event, file, store, path, alias);
		});
		file.addEventListener("error", function (message, url, line) {
			delete store[alias];
			delete store[path];
			if (paths.notEmpty()) {
				File.load(store, object, loadEvent, uponLoad, directory, filetype, paths, alias, external, uponError);
				return true;
			} else {
				return uponError ? uponError(message, url, line) : false;
			}
		});
		return null;
	}
};
Files = {};

Sprite = {
	load : function (paths, alias, external, uponError) {
		return File.load("sprites", Image, "load", function (event, image, store, path, alias) {
			var data = {
				image : image,
				width : image.width,
				height : image.height,
				animated : false
			};
			if (ImageData.hasOwnProperty(path.replace(/~.*/, ""))) {
				var imageData = ImageData[path.replace(/~.*/, "")];
				data.animated = imageData.animated;
				if (data.animated) {
					data.frames = imageData.durations.length;
					data.durations = imageData.durations;
					data.width /= data.frames;
				}
			}
			store[alias] = store[path] = data;
		}, "images", "png", paths, alias, external, uponError);
	}
};

Sound = {
	load : function (paths, alias, external, uponError, playImmediately) {
		return File.load("sounds", Audio, "canplaythrough", function (event, sound, store, path, alias) {
			var data = {
				sound : sound
			};
			store[alias] = store[path] = data;
			if (playImmediately && _(Settings, "sound effects"))
				sound.play();
		}, "sounds", "mp3", path, alias, external, uponError);
	},
	play : function (paths, alias, external, uponError) {
		if (_(Settings, "sound effects")) {
			var sound;
			if (sound = Sound.load(paths, alias, external, uponError, true)) {
				sound.sound.currentTime = 0;
				sound.sound.play();
			}
		}
	}
};
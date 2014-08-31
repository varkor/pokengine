File = {
	load : function (store, object, loadEvent, uponLoad, directory, filetype, path, alias, external) {
		if (!Files.hasOwnProperty(store))
			Files[store] = {};
		store = Files[store];
		alias = alias || path;
		if (store.hasOwnProperty(alias))
			return store[alias];
		else if (store.hasOwnProperty(path)) {
			store[alias] = store[path];
			return store[alias];
		}
		var file = new object();
		file.src = (!external ? directory + "/" + path + "." + filetype : path);
		store[path] = null;
		store[alias] = null;
		file.addEventListener(loadEvent, function (event) {
			uponLoad(event, file, store, path, alias);
		});
		return null;
	}
};
Files = {};

Sprite = {
	load : function (path, alias, external) {
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
		}, "images", "png", path, alias, external || path.substr(0, 5) === "data:");
	}
};

Sound = {
	load : function (path, alias, external, playImmediately) {
		return File.load("sounds", Audio, "canplaythrough", function (event, sound, store, path, alias) {
			var data = {
				sound : sound
			};
			store[alias] = store[path] = data;
			if (playImmediately && _(Settings, "sound effects"))
				sound.play();
		}, "sounds", "mp3", path, alias, external);
	},
	play : function (path, alias, external) {
		if (_(Settings, "sound effects")) {
			var sound;
			if (sound = Sound.load(path, alias, external, true)) {
				sound.sound.currentTime = 0;
				sound.sound.play();
			}
		}
	}
};
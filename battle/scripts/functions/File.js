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
	},
	draw : function (canvas, path, x, y, aligned, filters, transformation, time) {
		var sprite = Sprite.load(path);
		if (sprite) {
			var image = sprite.image, positionModification = {
				x : 0,
				y : 0
			}, progress = (sprite.animated ? (arguments.length < 7 ? Time.now() : time) % sum(sprite.durations) : 0), frame = 0;
			if (sprite.animated) {
				while (progress > sprite.durations[frame])
					progress -= sprite.durations[frame ++];
			}
			if (aligned) {
				switch (canvas.context.textAlign) {
					case "center":
						positionModification.x = - sprite.width / 2;
						break;
					case "right":
						positionModification.x = - sprite.width;
						break;
				}
				switch (canvas.context.textBaseline) {
					case "middle":
						positionModification.y = - sprite.height / 2;
						break;
					case "bottom":
						positionModification.y = - sprite.height;
						break;
				}
			}
			positionModification.x -= View.position.x;
			positionModification.y -= View.position.y;
			canvas.temporary[2].width = sprite.width;
			canvas.temporary[2].height = sprite.height;
			canvas.temporary[2].context.drawImage(image, frame * sprite.width, 0, sprite.width, sprite.height, 0, 0, sprite.width, sprite.height);
			image = canvas.temporary[2];
			if (filters) {
				filters = wrapArray(filters);
				foreach(filters, function (filter, number) {
					foreach(canvas.temporary, function (temporaryCanvas, i) {
						if (i === 2)
							return;
						temporaryCanvas.width = sprite.width;
						temporaryCanvas.height = sprite.height;
					});
					if (!filter.hasOwnProperty("type")) {
						canvas.temporary[0].context.drawImage(image, 0, 0);
						var imageData = canvas.temporary[0].context.getImageData(0, 0, canvas.temporary[0].width, canvas.temporary[0].height), pixels = imageData.data;
						for (var i = 0, newPixel, excludeBlankPixels = true; i < pixels.length; i += 4) {
							if (pixels[i + 3] === 0 && excludeBlankPixels)
								continue;
							newPixel = filter(i % 4, pixels[i + 0], pixels[i + 1], pixels[i + 2], pixels[i + 3]);
							pixels[i + 0] = Math.floor(newPixel[0]);
							pixels[i + 1] = Math.floor(newPixel[1]);
							pixels[i + 2] = Math.floor(newPixel[2]);
							pixels[i + 3] = Math.floor(newPixel[3]);
						}
						canvas.temporary[0].context.clearRect(0, 0, canvas.temporary[0].width, canvas.temporary[0].height);
						canvas.temporary[0].context.putImageData(imageData, 0, 0);
					} else {
						switch (filter.type) {
							case "fill":
								canvas.temporary[0].context.fillStyle = filter.colour;
								canvas.temporary[0].context.fillRect(0, 0, canvas.temporary[0].width, canvas.temporary[0].height);
								canvas.temporary[1].context.fillStyle = "black";
								canvas.temporary[1].context.fillRect(0, 0, canvas.temporary[1].width, canvas.temporary[1].height);
								canvas.temporary[1].context.globalCompositeOperation = "destination-out";
								canvas.temporary[1].context.drawImage(image, 0, 0);
								canvas.temporary[0].context.globalCompositeOperation = "destination-out";
								canvas.temporary[0].context.drawImage(canvas.temporary[1], 0, 0);
								canvas.temporary[0].context.globalCompositeOperation = "source-over";
								canvas.temporary[1].context.globalCompositeOperation = "source-over";
								break;
							case "crop":
								var width = canvas.temporary[0].width, height = canvas.temporary[0].height;
								if (filter.hasOwnProperty("width"))
									width = filter.width;
								else if (filter.hasOwnProperty("widthRatio"))
									width *= filter.widthRatio;
								if (filter.hasOwnProperty("height"))
									height = filter.height;
								else if (filter.hasOwnProperty("heightRatio"))
									height *= filter.heightRatio;
								if (width > 0 && height > 0)
									canvas.temporary[0].context.drawImage(image, 0, 0, width, height, 0, 0, width, height);
								positionModification.y += canvas.temporary[0].height - height;
								break;
							case "opacity":
								canvas.temporary[0].context.globalAlpha = filter.value;
								canvas.temporary[0].context.drawImage(image, 0, 0);
								canvas.temporary[0].context.globalAlpha = 1;
								break;
						}
					}
					canvas.temporary[2].context.clearRect(0, 0, canvas.temporary[2].width, canvas.temporary[2].height);
					canvas.temporary[2].context.drawImage(canvas.temporary[0], 0, 0);
					image = canvas.temporary[2];
				});
			}
			if (transformation) {
				if (transformation[0])
					positionModification.x *= Math.abs(transformation[0]);
				if (transformation[3])
					positionModification.y *= Math.abs(transformation[3]);
				if (transformation[1] && aligned) {
					if (canvas.context.textAlign === "right" && transformation[0] >= 0 || canvas.context.textAlign === "left" && transformation[0] < 0)
						positionModification.y -= sprite.width * transformation[1];
					if (canvas.context.textAlign === "center")
						positionModification.y -= sprite.width * transformation[1] * 0.5;
				}
				if (transformation[2] && aligned) {
					if (canvas.context.textBaseline === "bottom" && transformation[3] >= 0 || canvas.context.textBaseline === "top" && transformation[3] < 0)
						positionModification.x -= sprite.height * transformation[2];
					if (canvas.context.textBaseline === "middle")
						positionModification.x -= sprite.height * transformation[2] * 0.5;
				}
				if (transformation[0] < 0)
					positionModification.x = sprite.width * Math.abs(transformation[0]) - positionModification.x;
				if (transformation[3] < 0)
					positionModification.y = sprite.height * Math.abs(transformation[3]) - positionModification.y;
			}
			x += positionModification.x;
			y += positionModification.y;
			x = Math.round(x);
			y = Math.round(y);
			if (transformation) {
				canvas.context.save();
				canvas.context.translate(x, y);
				canvas.context.transform(transformation[0], transformation[1], transformation[2], transformation[3], transformation[4], transformation[5]);
				x = y = 0;
			}
			canvas.context.drawImage(image, x, y);
			if (transformation) {
				canvas.context.restore();
			}
			return true;
		}
		return false;
	}
};

Sound = {
	load : function (paths, alias, external, uponError, playImmediately) {
		return File.load("sounds", Audio, "canplaythrough", function (event, sound, store, path, alias) {
			var data = {
				sound : sound
			};
			store[alias] = store[path] = data;
			if (playImmediately && Settings._("sound effects"))
				sound.play();
		}, "sounds", "mp3", path, alias, external, uponError);
	},
	play : function (paths, alias, external, uponError) {
		if (Settings._("sound effects")) {
			var sound;
			if (sound = Sound.load(paths, alias, external, uponError, true)) {
				sound.sound.currentTime = 0;
				sound.sound.play();
			}
		}
	}
};
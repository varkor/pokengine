File = {
	loadFileOfType : function (store, object, loadEvent, dataForFile, directory, filetype, paths, uponLoad, uponError, redirectedPaths) {
		if (!Files.hasOwnProperty(store))
			Files[store] = {};
		var substore = store;
		store = Files[store];
		paths = wrapArray(paths);
		redirectedPaths = redirectedPaths || [];
		var path = paths.shift();
		if (/(.*)\.(\w+)/.test(path))
			path = path.match(/(.*)\.(\w+)/)[1];
		var successful = function (data) {
			foreach(redirectedPaths.concat(path), function (redirect) {
				store[redirect] = data;
			});
			if (uponLoad)
				uponLoad(data);
		};
		if (store.hasOwnProperty(path)) {
			successful(store[path]);
			return store[path];
		}
		var file = new object();
		file.src = (!(path.substr(0, 5) === "data:" || path.substr(0, 5) === "http:" || path.substr(0, 6) === "https:") ? directory + "/" + path + "." + filetype : path);
		store[path] = null;
		file.addEventListener(loadEvent, function (event) {
			successful(dataForFile(event, file, store, path));
		});
		file.addEventListener("error", function (message, url, line) {
			delete store[path];
			redirectedPaths.push(path);
			if (paths.notEmpty()) {
				File.load(substore, object, loadEvent, dataForFile, directory, filetype, paths, uponLoad, uponError, redirectedPaths);
				return true;
			} else
				return uponError ? uponError(redirectedPaths, message) : false;
		});
		return null;
	},
	load : function (paths, uponLoad, uponError) {
		paths = wrapArray(paths);
		var filetype = paths[0].match(/.*\.(\w+)/);
		if (filetype === null) {
			uponError(paths, "The supplied file (" + paths[0] + ") had no filtype.");
			return null;
		}
		switch (filetype[1]) {
			case "png":
				return Sprite.load(paths, uponLoad, uponError);
			case "mp3":
				return Sound.load(paths, uponLoad, uponError);
			default:
				uponError(paths, "The supplied file (" + paths[0] + ") had an unsupported filtype.");
				break;
		}
	}
};
Files = {};

Sprite = {
	load : function (paths, uponLoad, uponError) {
		return File.loadFileOfType("sprites", Image, "load", function (event, image, store, path) {
			var data = {
				animated : false,
				frames : 1
			};
			var fileData;
			if ((fileData = FileData.images).hasOwnProperty(path.replace(/~.*/, ""))) {
				data = JSONCopy(fileData[path.replace(/~.*/, "")]);
				if (data.hasOwnProperty("durations"))
					data.frames = data.durations.length;
			}
			data.image = image;
			data.width = image.width / data.frames;
			data.height = image.height;
			return data;
		}, "images", "png", paths, uponLoad, uponError);
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
			} else if (arguments.length >= 8) {
				if (time >= 0 && time < sprite.frames)
					frame = time;
				else
					return false;
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
	load : function (paths, uponLoad, uponError, playImmediately) {
		return File.loadFileOfType("sounds", Audio, "canplaythrough", function (event, sound, store, path) {
			var data = {
				sound : sound
			};
			if (playImmediately && Settings._("sound effects"))
				sound.play();
			return store[path] = data;
		}, "sounds", "mp3", paths, uponLoad, uponError);
	},
	play : function (paths, uponError) {
		if (Settings._("sound effects")) {
			var sound;
			if (sound = Sound.load(paths, uponLoad, uponError, true)) {
				sound.sound.currentTime = 0;
				sound.sound.play();
			}
		}
	}
};

Text = {
	elements : {},
	clear : function () {
		forevery(Text.elements, function (element) {
			element.parentNode.removeChild(element);
		});
		Text.elements = {};
	},
	draw : function (canvas, text, x, y, identifier) {
		var newElement = !Text.elements.hasOwnProperty(identifier);
		if (newElement || (!newElement && Text.elements[identifier].innerHTML !== "" + text)) {
			var element = (newElement ? document.createElement("span") : Text.elements[identifier]), context = canvas.context, offset = Game.canvas.element.getBoundingClientRect();
			element.classList.add("canvas-element");
			element.style.font = context.font;
			element.style.color = context.fillStyle;
			element.style.left = (offset.left + x) + "px";
			element.style.top = (offset.top + y) + "px";
			element.innerHTML = "";
			element.appendChild(document.createTextNode(text));
			if (newElement) {
				Text.elements[identifier] = element;
				element.style.opacity = 0;
				document.body.appendChild(element);
			}
			var dimensions = element.getBoundingClientRect();
			switch (context.textAlign) {
				case "left":
					break;
				case "center":
					element.style.marginLeft = "-" + (dimensions.width / 2) + "px";
					break;
				case "right":
					element.style.marginLeft = "-" + dimensions.width + "px";
					break;
			}
			switch (context.textBaseline) {
				case "top":
					break;
				case "middle":
					element.style.marginTop = "-" + (dimensions.height / 2) + "px";
					break;
				case "bottom":
					element.style.marginTop = "-" + dimensions.height + "px";
					break;
			}
			element.style.opacity = 1;
			return element;
		}
	}
}
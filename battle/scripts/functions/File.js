File = {
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
			if (uponLoadObject)
				uponLoadObject.uponLoad(data);
		};
		if (store.hasOwnProperty(path)) {
			if (!store[path].hasOwnProperty("uponLoad")) {
				var uponLoadObject = null;
				if (uponLoad)
					uponLoadObject = { uponLoad : uponLoad };
				successful(store[path], uponLoadObject);
				return store[path];
			} else { // A file is already scheduled to be loaded, but hasn't finished loading yet
				store[path].uponLoad = function (oldUponLoad) { return function (data) {
					if (oldUponLoad)
						oldUponLoad(data);
					if (uponLoad)
						uponLoad(data);
				}; }(store[path].uponLoad);
				return null;
			}
		}
		var errorResponse = function (message, url, line) {
			Files.nonexistent.pushIfNotAlreadyContained(path);
			delete store[path];
			redirectedPaths.push(path);
			if (paths.notEmpty()) {
				File.load(substore, object, loadEvent, dataForFile, directory, filetype, paths, uponLoad, uponError, redirectedPaths);
				return true;
			} else
				return uponError ? uponError(redirectedPaths, message) : false;
		};
		if (Files.nonexistent.contains(path)) {
			errorResponse("Nonexistent file-path: " + path);
		} else {
			var file = new object(), uponLoadObject = {
				uponLoad : uponLoad
			};
			file.addEventListener(loadEvent, function (event) {
				successful(dataForFile(event, file, store, path), uponLoadObject);
			});
			file.addEventListener("error", errorResponse);
			file.src = (!(path.substr(0, 5) === "data:" || path.substr(0, 5) === "http:" || path.substr(0, 6) === "https:") ? (directory ? directory + "/" : "") + path + "." + filetype : path);
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
			uponError(paths[0], "The supplied file (" + paths[0] + ") had no filtype.");
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
Files = {
	nonexistent : []
};

Sprite = FunctionObject.new({
	canvases : [],
	load : function (_paths, uponLoad, uponError, filetype) {
		var paths = wrapArray(_paths);
		return File.loadFileOfType("sprites", Image, "load", function (event, image, store, path) {
			var data = {
				animated : false,
				frames : 1
			};
			var fileData, genericPath = path.replace(/^(animated|static)\//, "").replace(/~.*/, "");
			if (Settings._("animated sprites") && (fileData = FileData.images).hasOwnProperty(genericPath)) {
				data = JSONCopy(fileData[genericPath]);
				if (data.hasOwnProperty("durations"))
					data.frames = data.durations.length;
			}
			data.image = image;
			data.cache = {
				filters : {}
			};
			data.width = image.width / data.frames;
			data.height = image.height;
			return data;
		}, Settings._("paths => images").replace("{animation}", Settings._("animated sprites") && FileData.images.hasOwnProperty(path.replace(/~.*/, "")) ? "animated" : "static"), arguments.length >= 4 && typeof filetype !== "undefined" ? filetype : "png", paths, uponLoad, uponError);
	},
	filters : {
		invert : function (i, components) {
			return components.slice(0, -1).map(function (x) { return 255 - x; }).concat([components.last()]);
		},
		greyscale : function (i, components) {
			var x = (components[0] + components[1] + components[2]) / 3;
			return [x, x, x, components[3]];
		},
		shiny : function (i, components, data) {
			if (Pokedex._(data.pokemon._("species")).shiny.hasOwnProperty(components.slice(0, -1)))
				return Pokedex._(data.pokemon._("species")).shiny[components.slice(0, -1)].concat([components[3]]);
			else
				return components;
		}
	},
	draw : function (canvas, path, x, y, aligned, filters, transformation, time) {
		var sprite = Sprite.load(path);
		if (sprite) {
			var context = canvas.getContext("2d"), image = sprite.image, xModified = x, yModified = y, positionModification = {
				x : 0,
				y : 0
			}, progress = (sprite.animated ? (arguments.length < 8 ? performance.now() : time) % sum(sprite.durations) : 0), frame = 0;
			if (sprite.animated) {
				while (progress > sprite.durations[frame])
					progress -= sprite.durations[frame ++];
			} else if (arguments.length >= 8) {
				if (time >= 0 && time < sprite.frames)
					frame = time;
				else
					frame = 0; // Just set the frame to the first one if it overflows, rather than breaking
			}
			var contexts = [];
			foreach(Sprite.canvases, function (temp) {
				contexts.push(temp.getContext("2d"));
			});
			if (aligned) {
				switch (context.textAlign) {
					case "center":
						positionModification.x = - sprite.width / 2;
						break;
					case "right":
						positionModification.x = - sprite.width;
						break;
				}
				switch (context.textBaseline) {
					case "middle":
						positionModification.y = - sprite.height / 2;
						break;
					case "bottom":
					case "alphabetic":
						positionModification.y = - sprite.height;
						break;
				}
			}
			Sprite.canvases[2].width = sprite.width;
			Sprite.canvases[2].height = sprite.height;
			if (sprite.animated && sprite.cache.hasOwnProperty(frame)) {
				contexts[2].drawImage(sprite.cache[frame], 0, 0);
			} else {
				contexts[2].drawImage(image, frame * sprite.width, 0, sprite.width, sprite.height, 0, 0, sprite.width, sprite.height);
				if (sprite.animated) {
					sprite.cache[frame] = document.createElement("canvas");
					sprite.cache[frame].width = sprite.width;
					sprite.cache[frame].height = sprite.height;
					sprite.cache[frame].getContext("2d").drawImage(Sprite.canvases[2], 0, 0);
				}
			}
			image = Sprite.canvases[2];
			if (filters) {
				foreach(wrapArray(filters), function (filter, number) {
					foreach(Sprite.canvases, function (temporaryCanvas, i) {
						if (i === 2)
							return;
						temporaryCanvas.width = sprite.width;
						temporaryCanvas.height = sprite.height;
					});
					switch (filter.type) {
						case "filter":
							var filterFn, isVolatile = filter.hasOwnProperty("volatile") && filter.volatile, data = {};
							forevery(filter, function (value, property) {
								if (!["type", "kind", "volatile", "filter"].contains(property))
									data[property] = value;
							});
							if (filter.hasOwnProperty("filter"))
								filterFn = filter.filter;
							else if (Sprite.filters.hasOwnProperty(filter.kind))
								filterFn = Sprite.filters[filter.kind];
							else {
								Debugger.error("The invoked filter does not exist", filter.kind);
								return;
							}
							if (!isVolatile && sprite.cache.filters.hasOwnProperty(filter.kind) && sprite.cache.filters[filter.kind].hasOwnProperty(frame)) {
								contexts[0].drawImage(sprite.cache.filters[filter.kind][frame], 0, 0);
							} else {
								contexts[0].drawImage(image, 0, 0);
								try {
									var imageData = contexts[0].getImageData(0, 0, Sprite.canvases[0].width, Sprite.canvases[0].height), pixels = imageData.data;
									for (var i = 0, newPixel, excludeBlankPixels = true; i < pixels.length; i += 4) {
										if (pixels[i + 3] === 0 && excludeBlankPixels)
											continue;
										newPixel = filterFn(i % 4, [pixels[i + 0], pixels[i + 1], pixels[i + 2], pixels[i + 3]], data);
										pixels[i + 0] = Math.floor(newPixel[0]);
										pixels[i + 1] = Math.floor(newPixel[1]);
										pixels[i + 2] = Math.floor(newPixel[2]);
										pixels[i + 3] = Math.floor(newPixel[3]);
									}
									contexts[0].clearRect(0, 0, Sprite.canvases[0].width, Sprite.canvases[0].height);
									contexts[0].putImageData(imageData, 0, 0);
									// Cache that filter!
									if (!isVolatile) {
										if (!sprite.cache.filters.hasOwnProperty(filter.kind))
											sprite.cache.filters[filter.kind] = {};
										sprite.cache.filters[filter.kind][frame] = document.createElement("canvas");
										sprite.cache.filters[filter.kind][frame].width = sprite.width;
										sprite.cache.filters[filter.kind][frame].height = sprite.height;
										sprite.cache.filters[filter.kind][frame].getContext("2d").drawImage(Sprite.canvases[0], 0, 0);
									}
								} catch (crossOriginError) {
									// Simply use the original image without a filter
								}
							}
							break;
						case "fill":
							contexts[0].fillStyle = filter.colour;
							contexts[0].fillRect(0, 0, Sprite.canvases[0].width, Sprite.canvases[0].height);
							contexts[1].fillStyle = "black";
							contexts[1].fillRect(0, 0, Sprite.canvases[1].width, Sprite.canvases[1].height);
							contexts[1].globalCompositeOperation = "destination-out";
							contexts[1].drawImage(image, 0, 0);
							contexts[0].globalCompositeOperation = "destination-out";
							contexts[0].drawImage(Sprite.canvases[1], 0, 0);
							contexts[0].globalCompositeOperation = "source-over";
							contexts[1].globalCompositeOperation = "source-over";
							break;
						case "crop":
							var width = Sprite.canvases[0].width, height = Sprite.canvases[0].height;
							if (filter.hasOwnProperty("width"))
								width = filter.width;
							else if (filter.hasOwnProperty("widthRatio"))
								width *= filter.widthRatio;
							if (filter.hasOwnProperty("height"))
								height = filter.height;
							else if (filter.hasOwnProperty("heightRatio"))
								height *= filter.heightRatio;
							if (width > 0 && height > 0)
								contexts[0].drawImage(image, 0, 0, width, height, 0, 0, width, height);
							positionModification.y += Sprite.canvases[0].height - height;
							break;
						case "opacity":
							contexts[0].globalAlpha = filter.value;
							contexts[0].drawImage(image, 0, 0);
							contexts[0].globalAlpha = 1;
							break;
					}
					contexts[2].clearRect(0, 0, Sprite.canvases[2].width, Sprite.canvases[2].height);
					contexts[2].drawImage(Sprite.canvases[0], 0, 0);
					image = Sprite.canvases[2];
				});
			}
			if (transformation) {
				if (transformation[0])
					positionModification.x *= Math.abs(transformation[0]);
				if (transformation[3])
					positionModification.y *= Math.abs(transformation[3]);
				if (transformation[1] && aligned) {
					if (context.textAlign === "right" && transformation[0] >= 0 || context.textAlign === "left" && transformation[0] < 0)
						positionModification.y -= sprite.width * transformation[1];
					if (context.textAlign === "center")
						positionModification.y -= sprite.width * transformation[1] * 0.5;
				}
				if (transformation[2] && aligned) {
					if (context.textBaseline === "bottom" && transformation[3] >= 0 || context.textBaseline === "top" && transformation[3] < 0)
						positionModification.x -= sprite.height * transformation[2];
					if (context.textBaseline === "middle")
						positionModification.x -= sprite.height * transformation[2] * 0.5;
				}
				if (transformation[0] < 0)
					positionModification.x = sprite.width * Math.abs(transformation[0]) - positionModification.x;
				if (transformation[3] < 0)
					positionModification.y = sprite.height * Math.abs(transformation[3]) - positionModification.y;
			}
			xModified += positionModification.x;
			yModified += positionModification.y;
			xModified = Math.round(xModified);
			yModified = Math.round(yModified);
			if (transformation) {
				context.save();
				context.translate(xModified, yModified);
				context.transform(transformation[0], transformation[1], transformation[2], transformation[3], transformation[4], transformation[5]);
				xModified = yModified = 0;
			}
			context.drawImage(image, xModified, yModified);
			if (transformation) {
				context.restore();
			}
			return true;
		}
		return false;
	}
}, {
	initialise : function () {
		for (var i = 0, canvas; i < 3; ++ i) {
			canvas = document.createElement("canvas");
			canvas.width = Settings._("screen dimensions => width");
			canvas.height = Settings._("screen dimensions => height");
			canvas.getContext("2d").imageSmoothingEnabled = false;
			Sprite.canvases.push(canvas);
		}
	}
});

Sound = {
	load : function (paths, uponLoad, uponError, filetype, playImmediately) {
		return File.loadFileOfType("sounds", Audio, "canplaythrough", function (event, sound, store, path) {
			var data = {
				sound : sound
			};
			if (playImmediately && Settings._("sound effects"))
				sound.play();
			return store[path] = data;
		}, Settings._("paths => sounds"), arguments.length >= 4 && typeof filetype !== "undefined" ? filetype : "mp3", paths, uponLoad, uponError);
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

Font = {
	load : function (size, weight, style, typeface) {
		if (!["px", "pt", "em", "rem"].contains(("" + size).substr(-2)))
			size += "px";
		return (style || "") + " " + (weight || Settings._("font").weight) + " " + size + " " + (typeface || Settings._("font").typeface);
	},
	loadFromStyle : function (style, zoom) {
		return Font.load(style.size * (arguments.length >= 2 ? zoom : 1), style.weight, style.style);
	}
};
"use strict";

const Sprite = FunctionObject.new({
	canvases : [],
	load : function (_paths, uponLoad, uponError, _filetype) {
		var paths = wrapArray(_paths).slice(0), filetype = arguments.length >= 4 && typeof _filetype !== "undefined" ? _filetype : null;
		if (filetype === null) {
			var filetypeMatch = paths[0].replace(/\{.*\}/, "").match(/\.[a-z0-9]+$/i);
			if (filetypeMatch) {
				filetype = filetypeMatch[0].slice(1);
				foreach(paths, function (path, i) {
					paths[i] = paths[i].replace("." + filetype, "");
				});
			} else {
				filetype = "png";
			}
		}
		foreach(paths, function (path, i) {
			paths[i] = Settings._("paths => images").replace("{animation}", Sprite.shouldAnimate(path) ? "animated" : "static") + "/" + paths[i];
			if (typeof Cache === "object" && Cache !== null) {
				paths[i] = paths[i].replace("{cache}", Cache.getURL(paths[i] + "." + filetype, null, true));
			}
		});
		return File.loadFileOfType("sprites", Image, "load", function (event, image, store, path) {
			var data = {
				animated : false,
				frames : 1
			};
			var fileData = FileData.images, genericPath = path.replace(new RegExp("^" + Settings._("paths => images").replace("/{animation}", "") + "/"), "").replace(/[~?].*/, "").replace(/(animated|static)\//, "");
			if (Sprite.shouldAnimate(genericPath)) {
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
		}, null, filetype, paths, uponLoad, uponError);
	},
	shouldAnimate : function (path) {
		return Settings._("animated sprites") && FileData.images.hasOwnProperty(path.replace(/(~|\.).*/, "").replace("?", "").replace(/\/?\{(animation|cache)\}/g, ""));
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
			var replacements = data.pokemon.currentProperty("shiny");
			if (replacements.hasOwnProperty(components.slice(0, -1)))
				return replacements[components.slice(0, -1)].concat([components[3]]);
			else
				return components;
		}
	},
	draw : function (canvas, path, x, y, aligned, filters, transformation, time, skewOffset) {
		var sprite = Sprite.load(path);
		if (sprite) {
			var context = canvas.getContext("2d"), image = sprite.image, positionModification = {
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
								// Cached filters may not work well with other filters (such as crop), because they will load a version that may not include the other filter. Thus, ordering can be important.
								contexts[0].drawImage(sprite.cache.filters[filter.kind][frame], 0, 0);
							} else {
								contexts[0].drawImage(image, 0, 0);
								try {
									var imageData = contexts[0].getImageData(0, 0, Sprite.canvases[0].width, Sprite.canvases[0].height), pixels = imageData.data;
									for (var i = 0, newPixel, excludeBlankPixels = true; i < pixels.length; i += 4) {
										if (pixels[i + 3] === 0 && excludeBlankPixels)
											continue;
										newPixel = filterFn(Math.floor(i / 4), [pixels[i + 0], pixels[i + 1], pixels[i + 2], pixels[i + 3]], data);
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
							contexts[0].drawImage(image, 0, 0);
							contexts[0].globalCompositeOperation = "source-in";
							contexts[0].fillStyle = filter.colour;
							contexts[0].fillRect(0, 0, Sprite.canvases[0].width, Sprite.canvases[0].height);
							contexts[0].globalCompositeOperation = "source-over";
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
			if (!transformation)
				transformation = new Matrix();
			context.save();
			context.translate(x, y);
			transformation.applyToContext(context);
			context.drawImage(image, Math.round(positionModification.x), Math.round(positionModification.y));
			context.restore();
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
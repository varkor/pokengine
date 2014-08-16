Game = {
	debug : false,
	control : {
		schemes : {
			mouse : q = 0,
			keyboard : ++ q
		},
		current : null
	},
	key : {
		primary : "space",
		secondary : "z",
		up : "up",
		right : "right",
		down : "down",
		left : "left"
	},
	keys : {
		held : {},
		heldKeys : function () {
			var held = [];
			forevery(Game.keys.held, function (duration, key) {
				held.push(key);
			});
			return held;
		},
		pressedKeys : function () {
			var pressed = [];
			forevery(Game.keys.held, function (duration, key) {
				if (duration === 1)
					pressed.push(key);
			});
			return pressed;
		},
		press : function (key) {
			if (!Game.keys.held.hasOwnProperty(key))
				Game.keys.held[key] = 1;
			if (key !== "unknown") {
				if (Game.control.current === Game.control.schemes.keyboard) {
					if (Textbox.active) {
						switch (key) {
							case Game.key.primary:
								Textbox.progress();
								break;
							case Game.key.up:
								Textbox.selectAdjacent(Directions.up);
								break;
							case Game.key.right:
								Textbox.selectAdjacent(Directions.right);
								break;
							case Game.key.down:
								Textbox.selectAdjacent(Directions.down);
								break;
							case Game.key.left:
								Textbox.selectAdjacent(Directions.left);
								break;
							default:
								if (key !== "unknown") {
									Game.control.current = Game.control.schemes.keyboard;
									Textbox.key(Game.keys.combination(Game.keys.heldKeys()));
								}
								break;
						}
					}
				}
				Game.control.current = Game.control.schemes.keyboard;
			}
		},
		release : function (key) {
			delete Game.keys.held[key];
		},
		combination : function (keys) {
			var combo = [];
			if (arguments.length > 0 && Array.isArray(keys))
				combo = keys;
			else {
				for (var i = 0; i < arguments.length; ++ i)
					combo.push(arguments[i]);
			}
			return combo.sort().join(", ");
		}
	},
	cursor : {
		x : null,
		y : null,
		inArea : function (x, y, width, height) {
			return (Game.cursor.x >= x && Game.cursor.x < x + width && Game.cursor.y >= y && Game.cursor.y < y + height);
		}
	},
	click : function () {
		if (Textbox.active) {
			Game.control.current = Game.control.schemes.mouse;
			Textbox.progress();
		}
	},
	initialise : function () {
		Game.control.current = Game.control.schemes.keyboard;
		window.addEventListener("keydown", function (event) {
			Game.keys.press(keyname(event.keyCode));
		});
		window.addEventListener("keyup", function (event) {
			Game.keys.release(keyname(event.keyCode));
		});
		window.addEventListener("mousedown", function (event) {
			Game.click();
		});
		window.addEventListener("mousemove", function (event) {
			Game.cursor.x = event.clientX - Game.canvas.element.offsetLeft + Game.canvas.element.width / 2;
			Game.cursor.y = event.clientY - Game.canvas.element.offsetTop + Game.canvas.element.height / 2;
		});
	},
	increment : 0,
	unique : function () {
		// Returns a unique id that can be used to identify different objects
		return Game.increment ++;
	},
	canvas : {
		element : null,
		context : null,
		temporary : [],
		initialise : function () {
			var self = Game.canvas.element = document.getElementById("battle");
			Game.canvas.context = self.getContext("2d");
			self.width = 356;
			self.height = 288;
			Game.canvas.context.imageSmoothingEnabled = false;
			for (var i = 0; i < 3; ++ i) {
				Game.canvas.temporary[i] = document.createElement("canvas");
				Game.canvas.temporary[i].context = Game.canvas.temporary[i].getContext("2d");
				Game.canvas.temporary[i].context.imageSmoothingEnabled = false;
			}
			Game.fps.element = document.getElementById("fps");
			Game.fps.context = Game.fps.element.getContext("2d");
			Game.fps.element.width = 96;
			Game.fps.element.height = 32;
			Game.update();
			Game.redraw();
		},
		draw : {
			sprite : function (path, x, y, aligned, filters, transformation) {
				var sprite = Sprite.load(path);
				if (sprite) {
					var image = sprite, positionModification = {x : 0, y : 0};
					if (aligned) {
						switch (Game.canvas.context.textAlign) {
							case "center":
								positionModification.x = - image.width / 2;
								break;
							case "right":
								positionModification.x = - image.width;
								break;
						}
						switch (Game.canvas.context.textBaseline) {
							case "middle":
								positionModification.y = - image.height / 2;
								break;
							case "bottom":
								positionModification.y = - image.height;
								break;
						}
					}
					positionModification.x -= View.position.x;
					positionModification.y -= View.position.y;
					if (filters) {
						if (!Array.isArray(filters))
							filters = [filters];
						foreach(filters, function (filter, number) {
							foreach(Game.canvas.temporary, function (canvas, i) {
								if (i === 2 && number !== 0)
									return;
								canvas.width = sprite.width;
								canvas.height = sprite.height;
							});
							if (!filter.hasOwnProperty("type")) {
								Game.canvas.temporary[0].context.drawImage(sprite, 0, 0);
								var imageData = Game.canvas.temporary[0].context.getImageData(0, 0, Game.canvas.temporary[0].width, Game.canvas.temporary[0].height), pixels = imageData.data;
								for (var i = 0, newPixel, excludeBlankPixels = true; i < pixels.length; i += 4) {
									if (pixels[i + 3] === 0 && excludeBlankPixels)
										continue;
									newPixel = filter(i % 4, pixels[i + 0], pixels[i + 1], pixels[i + 2], pixels[i + 3]);
									pixels[i + 0] = Math.floor(newPixel[0]);
									pixels[i + 1] = Math.floor(newPixel[1]);
									pixels[i + 2] = Math.floor(newPixel[2]);
									pixels[i + 3] = Math.floor(newPixel[3]);
								}
								Game.canvas.temporary[0].context.clearRect(0, 0, Game.canvas.temporary[0].width, Game.canvas.temporary[0].height);
								Game.canvas.temporary[0].context.putImageData(imageData, 0, 0);
							} else {
								switch (filter.type) {
									case "fill":
										Game.canvas.temporary[0].context.fillStyle = filter.colour;
										Game.canvas.temporary[0].context.fillRect(0, 0, Game.canvas.temporary[0].width, Game.canvas.temporary[0].height);
										Game.canvas.temporary[1].context.fillStyle = "black";
										Game.canvas.temporary[1].context.fillRect(0, 0, Game.canvas.temporary[1].width, Game.canvas.temporary[1].height);
										Game.canvas.temporary[1].context.globalCompositeOperation = "destination-out";
										Game.canvas.temporary[1].context.drawImage(image, 0, 0);
										Game.canvas.temporary[0].context.globalCompositeOperation = "destination-out";
										Game.canvas.temporary[0].context.drawImage(Game.canvas.temporary[1], 0, 0);
										Game.canvas.temporary[0].context.globalCompositeOperation = "source-over";
										Game.canvas.temporary[1].context.globalCompositeOperation = "source-over";
										break;
									case "crop":
										var width = Game.canvas.temporary[0].width, height = Game.canvas.temporary[0].height;
										if (filter.hasOwnProperty("width"))
											width = filter.width;
										else if (filter.hasOwnProperty("widthRatio"))
											width *= filter.widthRatio;
										if (filter.hasOwnProperty("height"))
											height = filter.height;
										else if (filter.hasOwnProperty("heightRatio"))
											height *= filter.heightRatio;
										if (width > 0 && height > 0)
											Game.canvas.temporary[0].context.drawImage(image, 0, 0, width, height, 0, 0, width, height);
										positionModification.y += Game.canvas.temporary[0].height - height;
										break;
									case "opacity":
										Game.canvas.temporary[0].context.globalAlpha = filter.value;
										Game.canvas.temporary[0].context.drawImage(image, 0, 0);
										Game.canvas.temporary[0].context.globalAlpha = 1;
										break;
								}
							}
							Game.canvas.temporary[2].context.clearRect(0, 0, Game.canvas.temporary[2].width, Game.canvas.temporary[2].height);
							Game.canvas.temporary[2].context.drawImage(Game.canvas.temporary[0], 0, 0);
							image = Game.canvas.temporary[2];
						});
					}
					if (transformation) {
						if (transformation[0])
							positionModification.x *= Math.abs(transformation[0]);
						if (transformation[3])
							positionModification.y *= Math.abs(transformation[3]);
						if (transformation[1] && aligned) {
							if (Game.canvas.context.textAlign === "right" && transformation[0] >= 0 || Game.canvas.context.textAlign === "left" && transformation[0] < 0)
								positionModification.y -= image.width * transformation[1];
							if (Game.canvas.context.textAlign === "center")
								positionModification.y -= image.width * transformation[1] * 0.5;
						}
						if (transformation[2] && aligned) {
							if (Game.canvas.context.textBaseline === "bottom" && transformation[3] >= 0 || Game.canvas.context.textBaseline === "top" && transformation[3] < 0)
								positionModification.x -= image.height * transformation[2];
							if (Game.canvas.context.textBaseline === "middle")
								positionModification.x -= image.height * transformation[2] * 0.5;
						}
						if (transformation[0] < 0)
							positionModification.x = image.width * Math.abs(transformation[0]) - positionModification.x;
						if (transformation[3] < 0)
							positionModification.y = image.height * Math.abs(transformation[3]) - positionModification.y;
					}
					x += positionModification.x;
					y += positionModification.y;
					if (transformation) {
						Game.canvas.context.save();
						Game.canvas.context.translate(x, y);
						Game.canvas.context.transform(transformation[0], transformation[1], transformation[2], transformation[3], transformation[4], transformation[5]);
						x = y = 0;
					}
					Game.canvas.context.drawImage(image, x, y);
					if (transformation) {
						Game.canvas.context.restore();
					}
					return true;
				}
				return false;
			}
		}
	},
	previousFrame : Time.now(),
	fps : {
		framerate : function () {
			var past = Time.framerate, average = 0; // Analyse the past so many frames
			for (var i = Game.fps.timeline.length - 1; i >= 0 && i >= Game.fps.timeline.length - past; -- i)
				average += Game.fps.timeline[i];
			average /= past;
			return average;
		},
		timeline: [],
		element : null,
		context : null
	},
	update : function () {
		forevery(Game.keys.held, function (duration, key) {
			Game.keys.held[key] = duration + 1;
		});
		if (Battle.active)
			Battle.update();
		if (Textbox.active)
			Textbox.update();
		setTimeout(Game.update, Time.refresh);
		var thisFrame = Time.now();
		Game.fps.timeline.push(Time.second / (thisFrame - Game.previousFrame));
		Game.previousFrame = thisFrame;
	},
	redraw : function () {
		if (Battle.active)
			Battle.redraw();
		if (Textbox.active)
			Textbox.redraw();
		var context = Game.fps.context;
		context.textAlign = "left";
		context.textBaseline = "middle";
		context.fillStyle = "hsla(0, 0%, 0%, 1)";
		context.fillRect(0, 0, Game.fps.element.width, Game.fps.element.height);
		var fps = Game.fps.framerate();
		context.beginPath();
		context.moveTo(0, (fps / Time.framerate) * Game.fps.element.height);
		context.lineTo(Game.fps.element.width, (fps / Time.framerate) * Game.fps.element.height);
		context.strokeStyle = "hsla(0, 0%, 100%, 0)";
		context.stroke();
		var gradient = context.createLinearGradient(0, 0, Game.fps.element.width, 0);
		context.beginPath();
		var past = Time.framerate;
		for (var i = Game.fps.timeline.length - 1, j = Time.framerate - 1, x; i >= 0 && i >= Game.fps.timeline.length - past; -- i, -- j) {
			x = ((j - Math.max(0, Time.framerate - Game.fps.timeline.length)) / (Time.framerate - 1)) * Game.fps.element.width;
			context.lineTo(x, (1 - ((Time.framerate - Game.fps.timeline[i]) / Time.framerate)) * Game.fps.element.height);
			gradient.addColorStop(x / Game.fps.element.width, "hsla(" + (Game.fps.timeline[i] / Time.framerate) * 60 + ", 100%, 50%, " + 1/*Math.pow(Math.max(0, 1 - Game.fps.timeline[i] / Time.framerate), 0.5)*/ + ")");
		}
		context.lineTo(0, Game.fps.element.height);
		context.lineTo((Math.min(Time.framerate, Game.fps.timeline.length) / Time.framerate) * Game.fps.element.width, Game.fps.element.height);
		context.fillStyle = gradient;
		context.fill();
		context.fillStyle = "white";
		
		context.font = "lighter 16px Helvetica Neue";
		context.fillText("fps: " + fps.toFixed(1), 16, Game.fps.element.height / 2);
		window.requestAnimationFrame(Game.redraw);
	},
	player : null,
	takePossessionOf : function (entity) {
		Game.player = entity;
		entity.type = Characters.type.local;
	}
};

Game.initialise();
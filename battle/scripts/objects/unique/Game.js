Game = {
	cursor : {
		x : null,
		y : null,
		inArea : function (x, y, width, height) {
			return (Game.cursor.x >= x && Game.cursor.x < x + width && Game.cursor.y >= y && Game.cursor.y < y + height);
		}
	},
	canvas : {
		element : null,
		context : null,
		temporary : [],
		initialise : function () {
			var self = Game.canvas.element = document.getElementById("battle");
			window.addEventListener("mousemove", function (event) {
				Game.cursor.x = event.clientX - Game.canvas.element.offsetLeft + Game.canvas.element.width / 2;
				Game.cursor.y = event.clientY - Game.canvas.element.offsetTop + Game.canvas.element.height / 2;
			});
			Game.canvas.context = self.getContext("2d");
			self.width = 356;
			self.height = 292;
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
	keys : {
		primary : "space"
	},
	key : function (key) {
		if (Textbox.active)
			if (key === Game.keys.primary)
				Textbox.progress();
	},
	previousFrame : Time.now(),
	fps : {
		framerate : function () {
			var past = Time.framerate, average = 0; // Analyse the past 10 frames
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
		context.fillStyle = "white";
		context.font = "lighter 16px Helvetica Neue";
		context.fillText("fps: " + Game.fps.framerate().toFixed(1), 16, Game.fps.element.height / 2);
		window.requestAnimationFrame(Game.redraw);
	},
	player : null
};

window.addEventListener("keydown", function (event) {
	Game.key(keyname(event.keyCode));
});
window.addEventListener("mousedown", function (event) {
	Game.key("space");
});
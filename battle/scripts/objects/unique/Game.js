Game = {
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
		/*window.addEventListener("mousedown", function (event) {
			if (event.button !== 0)
				return;
			Game.click();
		});*/
		window.addEventListener("mousemove", function (event) {
			Game.cursor.x = event.clientX - Game.canvas.element.offsetLeft + Game.canvas.element.width / 2 + window.scrollX;
			Game.cursor.y = event.clientY - Game.canvas.element.offsetTop + Game.canvas.element.height / 2 + window.scrollY;
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
			var self = Game.canvas.element = document.querySelector("#battle");
			Game.canvas.context = self.getContext("2d");
			self.width = 356;
			self.height = 288;
			Game.canvas.context.imageSmoothingEnabled = false;
			for (var i = 0; i < 3; ++ i) {
				Game.canvas.temporary[i] = document.createElement("canvas");
				Game.canvas.temporary[i].context = Game.canvas.temporary[i].getContext("2d");
				Game.canvas.temporary[i].context.imageSmoothingEnabled = false;
			}
			Game.fps.element = document.querySelector("#fps");
			Game.fps.context = Game.fps.element.getContext("2d");
			Game.fps.element.width = 96;
			Game.fps.element.height = 32;
			Game.update();
			Game.redraw();
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
			gradient.addColorStop(Math.clamp(0, x / Game.fps.element.width, 1), "hsla(" + (Game.fps.timeline[i] / Time.framerate) * 60 + ", 100%, 50%, " + 1/*Math.pow(Math.max(0, 1 - Game.fps.timeline[i] / Time.framerate), 0.5)*/ + ")");
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
		entity.type = Trainers.type.local;
	}
};

Game.initialise();
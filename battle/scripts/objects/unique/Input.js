Input = FunctionObject.new({
	controlScheme : "keyboard"
}, {
	update : function () {
		forevery(Keys.held, function (duration, key) {
			Keys.held[key] = duration + 1;
		});
	}
});

Keys = {
	name : function (key) {
		if (typeof key === "string")
			return key;
		if (key >= 65 && key <= 90) {
			return String.fromCharCode(key);
		}
		if (key >= 96 && key <= 105) {
			return "numpad " + (key - 96);
		}
		switch (key) {
			case 8:
				return "backspace";
			case 9:
				return "tab";
			case 13:
				return "return";
			case 16:
				return "shift";
			case 17:
				return "control";
			case 18:
				return "option";
			case 20:
				return "caps lock";
			case 27:
				return "escape";
			case 32:
				return "space";
			case 33:
				return "page up";
			case 34:
				return "page down";
			case 35:
				return "end";
			case 36:
				return "home";
			case 37:
				return "left";
			case 38:
				return "up";
			case 39:
				return "right";
			case 40:
				return "down";
			case 46:
				return "delete";
			case 106:
				return "numpad *";
			case 107:
				return "numpad +";
			case 109:
				return "numpad -";
			case 110:
				return "numpad .";
			case 111:
				return "numpad /";
			case 186:
				return ";";
			case 187:
				return "=";
			case 188:
				return ",";
			case 189:
				return "-";
			case 190:
				return ".";
			case 191:
				return "/";
			case 192:
				return "`";
			case 219:
				return "[";
			case 220:
				return "\\";
			case 221:
				return "]";
			case 222:
				return "\"";
			default:
				return "unknown (" + key + ")";
		}
	},
	held : {},
	heldKeys : function () {
		var held = [];
		forevery(Keys.held, function (duration, key) {
			held.push(key);
		});
		return held;
	},
	pressedKeys : function () {
		var pressed = [];
		forevery(Keys.held, function (duration, key) {
			if (duration === 1)
				pressed.push(key);
		});
		return pressed;
	},
	press : function (key) {
		if (!Keys.held.hasOwnProperty(key))
			Keys.held[key] = 1;
		if (key !== "unknown") {
			if (Input.controlScheme === "keyboard") {
				if (Textbox.active) {
					switch (key) {
						case Settings._("keys => primary"):
							Textbox.progress();
							return true;
						case Settings._("keys => up"):
							Textbox.selectAdjacent(Directions.up);
							return true;
						case Settings._("keys => right"):
							Textbox.selectAdjacent(Directions.right);
							return true;
						case Settings._("keys => down"):
							Textbox.selectAdjacent(Directions.down);
							return true;
						case Settings._("keys => left"):
							Textbox.selectAdjacent(Directions.left);
							return true;
						default:
							if (key !== "unknown") {
								Textbox.key(Keys.combination(Keys.heldKeys()));
							}
							break;
					}
				}
			}
			Input.controlScheme = "keyboard";
		}
	},
	release : function (key) {
		delete Keys.held[key];
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
};
window.addEventListener("keydown", function (event) {
	if (Keys.press(Keys.name(event.keyCode))) {
		event.preventDefault();
		event.stopPropagation();
	}
});
window.addEventListener("keydown", function (event) {
	if (Keys.release(Keys.name(event.keyCode))) {
		event.preventDefault();
		event.stopPropagation();
	}
});

Cursor = {
	x : null,
	y : null,
	inArea : function (element, x, y, width, height) {
		var cursorX = Cursor.x - element.offsetLeft + element.width / 2 + window.scrollX, cursorY = Cursor.y - element.offsetTop + element.height / 2 + window.scrollY;
		// console.log(Cursor.x, Cursor.y, x, y, width, height);
		return (cursorX >= x && cursorX < x + width && cursorY >= y && cursorY < y + height);
	},
	click : function () {
		Input.controlScheme = "mouse";
		if (Cursor.inArea(Textbox.canvas, 0, 0, Textbox.canvas.width, Textbox.canvas.height))
			Textbox.progress();
	}
};
window.addEventListener("mousemove", function (event) {
	Cursor.x = event.clientX;
	Cursor.y = event.clientY;
});
window.addEventListener("mousedown", function (event) {
	if (event.button === 0)
		Cursor.click(event.button);
});
Input = FunctionObject.new({
	controlScheme : "keyboard"
}, {
	update : function () {
		forevery(Keys.held, function (duration, key) {
			if (!foreach(Keys.handlers, function (handler) {
				if (handler.keys.contains(key) && handler.handler(key, duration === 1))
					return true;
				if (Keys.heldKeys().length > 1 && handler.keys.contains(Keys.combination(Keys.heldKeys())) && handler.handler(Keys.combination(Keys.heldKeys()), duration === 1))
					return true;
			})) {
				if (duration === 1 && !/unknown (.*)/.test(key)) {
					if (Input.controlScheme !== "keyboard" && (typeof Textbox === "undefined" || Textbox.dialogue.empty() || Textbox.dialogue.first().responses.empty()))
						Input.controlScheme = "keyboard";
					if (Input.controlScheme === "keyboard") {
						if (Game.focused && typeof Textbox !== "undefined" && Textbox.active) {
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
									if (!/unknown (.*)/.test(key)) {
										Textbox.key(Keys.combination(Keys.heldKeys()));
									}
									break;
							}
						}
					}
					Input.controlScheme = "keyboard";
				}
			}
		});
		forevery(Keys.held, function (duration, key) {
			Keys.held[key] = duration + 1;
		});
	}
});

Keys = {
	name : function (key) {
		if (typeof key === "string")
			return key;
		if (key >= 48 && key <= 57) { // Numbers
			return String.fromCharCode(key);
		}
		if (key >= 65 && key <= 90) { // Letters
			return String.fromCharCode(key);
		}
		if (key >= 96 && key <= 105) { // Numpad numbers
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
			case 91:
				return "command";
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
	handlers : [],
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
	isHeld : function (key) {
		return Keys.held.hasOwnProperty(key);
	},
	isPressed : function (key) {
		return Keys.isHeld(key) && Keys.held[key].duration === 1;
	},
	addHandler : function (handler, forWhichKeys) {
		Keys.handlers.push({
			handler : handler,
			keys : wrapArray(forWhichKeys)
		});
	},
	press : function (key) {
		if (!Keys.held.hasOwnProperty(key))
			Keys.held[key] = 1;
		return false;
	},
	release : function (key) {
		delete Keys.held[key];
		return false;
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
	},
	simulate : function (key) {
		foreach(Keys.handlers, function (handler) {
			if (handler.keys.contains(key))
				handler.handler(key, true);
		});
	}
};
window.addEventListener("keydown", function (event) {
	if (Keys.press(Keys.name(event.keyCode))) {
		event.stopPropagation();
	}
	// if (!(event.metaKey || event.ctrlKey))
	// 	event.preventDefault();
});
window.addEventListener("keyup", function (event) {
	if (Keys.release(Keys.name(event.keyCode))) {
		event.stopPropagation();
	}
	// if (!(event.metaKey || event.ctrlKey))
	// 	event.preventDefault();
});

Cursor = {
	x : null,
	y : null,
	inArea : function (element, x, y, width, height) {
		var boundingRect = element.getBoundingClientRect(), cursorX = Cursor.x - boundingRect.left, cursorY = Cursor.y - boundingRect.top;
		return (cursorX >= x && cursorX < x + width && cursorY >= y && cursorY < y + height);
	},
	click : function () {
		Input.controlScheme = "mouse";
		if (typeof Textbox !== "undefined" && Textbox.canvas) {
			if (Cursor.inArea(Textbox.canvas, 0, 0, Textbox.canvas.width, Textbox.canvas.height))
				Textbox.progress();
		}
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
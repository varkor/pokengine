Textbox = {
	active : false,
	slide : 0,
	displayed : "",
	dialogue : [],
	response : null, // The selected option when a question is asked
	hoverResponse : null, // Which response the cursor is hovering over
	responsePosition : { x : 0, y : 0 }, // Used to allow for much more natural keyboard input
	finished : null,
	standardInterval : "manual"/* 0.8 * Time.seconds*/,
	pausing : false,
	after : null,
	speed : 100,
	padding : 16,
	height : 80,
	lines : 2,
	spacing : 0.5,
	colour : "white", // The default text colour
	messages : 0,
	namedDialogue : {}, // Allows the textbox to remember the user's last response to dialogue like "Fight, Run, Bag, etc."
	currentIndex : function () {
		var self = Textbox;
		return self.dialogue.last().id;
	},
	say : function (text, progress, trigger, pause, after, index) {
		/*
			text : The text to display,
			progress : How long to wait after displaying all the text before continuing ("manual" will require input from the user),
			trigger : A function to execute before continuing,
			pause : A condition to wait upon before finishing,
			after : A function to execute after pausing
		*/
		var self = Textbox, colours = [];
		if (text !== null) {
			text = String(text);
			console.log(text);
			var command, colour, previousColour, colourStack = [];
			while ((command = text.search(/<colour:.*?>/i)) > -1) {
				previousColour = colour;
				colour = /<colour:(.*?)>/i.exec(text)[1];
				if (colour === "" && colourStack.length)
					colour = colourStack.pop();
				else if (colour === ":" || (colour === "" && !colourStack.length))
					colour = "default";
				else if (previousColour)
					colourStack.push(previousColour);
				colours[command] = colour;
				text = text.replace(/<colour:(.*?)>/i, "");
			}
			text = self.wrap(text);
		}
		var message = {
			id : self.messages ++,
			text : text,
			colours : colours,
			responses : [],
			progress : (arguments.length > 1 && progress !== null ? progress : "manual"),
			trigger : trigger,
			pause : pause,
			after : after
		};
		self.active = true;
		self.dialogue.push(message);
		return message.id;
	},
	insertAfter : function (id, position) {
		var self = Textbox, message = self.messageWithId(id), position = self.messageIndexForId(position);
		if (position !== null) {
			self.remove(id);
			self.dialogue.insert(position + 1, message);
			return id;
		} else
			return null;
	},
	messageWithId : function (id) {
		var self = Textbox, found = null;
		foreach(self.dialogue, function (message) {
			if (message.id === id) {
				found = message;
				return true;
			}
		});
		return found;
	},
	messageIndexForId : function (id) {
		var self = Textbox, found = null;
		foreach(self.dialogue, function (message, i) {
			if (message.id === id) {
				found = i;
				return true;
			}
		});
		return found;
	},
	state : function (text, trigger, pause, after) {
		var self = Textbox;
		return self.say(text, self.standardInterval, trigger, pause, after);
	},
	stateUntil : function (text, until) {
		var self = Textbox;
		self.say(text, until);
	},
	effect : function (trigger, pause, after) {
		var self = Textbox;
		return self.say(null, self.standardInterval, trigger, pause, after);
	},
	ask : function (query, responses, callback, minors, defaultResponse, hotkeys, name, hover) {
		var self = Textbox, latest;
		latest = self.messageWithId(self.say(query));
		latest.responses = responses.concat(minors || []);
		latest.callback = callback;
		latest.minorResponses = responses.length;
		if (arguments.length >= 5 && defaultResponse !== null && typeof defaultResponse !== "undefined") {
			if (typeof defaultResponse === "number")
				latest.defaultResponse = Math.clamp(0, defaultResponse, latest.responses.length - 1);
			else if (latest.responses.contains(defaultResponse))
				latest.defaultResponse = latest.responses.indexOf(defaultResponse);
			else
				latest.defaultResponse = null;
		} else
			latest.defaultResponse = null;
		if (arguments.length >= 6 && hotkeys !== null && typeof hotkeys !== "undefined") {
			forevery(hotkeys, function (response, key, deletion) {
				if (typeof response === "number") {
					if (response < 0 || response >= latest.responses.length)
						deletion.push(key);
				} else {
					if (latest.responses.contains(response))
						hotkeys[key] = latest.responses.indexOf(response);
					else
						deletion.push(key);
				}
			});
			latest.hotkeys = hotkeys;
		} else
			latest.hotkeys = {};
		if (arguments.length >= 7 && name !== null && typeof name !== "undefined") {
			if (self.namedDialogue.hasOwnProperty(name)) {
				if (latest.defaultResponse === null) {
					latest.defaultResponse = self.namedDialogue[name];
					latest.defaultResponse = Math.clamp(0, latest.defaultResponse, latest.responses.length - 1);
				}
			} else {
				self.namedDialogue[name] = null;
			}
			latest.name = name;
		}
		if (arguments.length >= 8 && hover !== null && typeof hover !== "undefined")
			latest.hover = hover;
		if (self.dialogue.length === 1)
			self.selectDefaultResponse();
		return latest.id;
	},
	confirm : function (query, callback, minors, defaultResponse, name, hover) {
		var hotkeys = {};
		hotkeys[Game.key.secondary] = "No";
		return Textbox.ask(query, ["No", "Yes"], callback, minors, defaultResponse, hotkeys, name, hover);
	},
	remove : function (id) {
		var self = Textbox, found = self.messageIndexForId(id);
		if (found !== null)
			self.dialogue.remove(found);
	},
	removeEffects : function (id) {
		var self = Textbox, found = self.messageIndexForId(id);
		if (found !== null) {
			self.dialogue[found].trigger = null;
			self.dialogue[found].pause = null;
			self.dialogue[found].after = null;
			if (self.dialogue[found].text === null)
				self.remove(id);
		}
	},
	wrap : function (text) {
		var self = Textbox;
		var context = Game.canvas.context;
		context.font = "lighter " + self.lineHeight() + "px Helvetica Neue";
		for (var i = 0, width = 0, character, breakpoint = null; i < text.length; ++ i) {
			character = text[i];
			if (character === "\n") {
				breakpoint = null;
				width = 0;
				continue;
			}
			if (/\s/.test(character))
				breakpoint = i;
			width += context.measureText(text[i]).width;
			if (width > Game.canvas.element.width - self.padding * 2) {
				if (breakpoint) {
					text = text.substr(0, breakpoint) + "\n" + text.substr(breakpoint + 1);
					breakpoint = null;
				}
				width = 0;
			}
		}
		return text;
	},
	progress : function (automatic) {
		var self = Textbox;
		if (self.dialogue.length === 0 || self.pausing || (!automatic && (self.dialogue[0].progress !== "manual" || self.dialogue[0].text === null)))
			return;
		if (self.dialogue[0].text === null || self.displayed.length === self.dialogue[0].text.length) {
			if (self.dialogue[0].responses.length && !automatic) {
				var response;
				if (self.hoverResponse !== null || (Game.control.current === Game.control.schemes.keyboard && self.response !== null)) {
					response = (self.hoverResponse !== null ? self.hoverResponse : self.response);
					Game.canvas.element.className = "centre"; // Remove the mouse hover CSS class
					if (self.dialogue[0].hasOwnProperty("name"))
						self.namedDialogue[self.dialogue[0].name] = response;
					self.dialogue[0].callback(self.dialogue[0].responses[response], response, response < self.dialogue[0].minorResponses);
				} else
					return;
			}
			var returned = null;
			if (self.dialogue[0].trigger)
				returned = self.dialogue[0].trigger();
			if (returned !== null && typeof returned === "object" && !self.dialogue[0].pause) {
				self.dialogue[0].pause = function () { return returned.completed; };
			}
			if (self.dialogue[0].pause) {
				self.pausing = self.dialogue[0].pause;
				if (self.dialogue[0].after)
					self.after = self.dialogue[0].after;
			}
			self.dialogue.shift();
			self.displayed = "";
			self.selectDefaultResponse();
		} else
			self.displayed = self.dialogue[0].text;
	},
	selectDefaultResponse : function () {
		var self = Textbox;
		if (self.dialogue.notEmpty() && self.dialogue[0].responses.length)
			self.selectResponse(self.dialogue[0].defaultResponse !== null ? self.dialogue[0].defaultResponse : 0);
	},
	selectResponse : function (response) {
		var self = Textbox;
		self.response = response;
		var selectedMajor = (self.response < self.dialogue[0].minorResponses), majorResponses = self.dialogue[0].minorResponses, minorResponses = self.dialogue[0].responses.length - self.dialogue[0].minorResponses;
		self.responsePosition = (self.response === null ? { x : null, y : null} : { x : (selectedMajor ? (self.response + 0.5) / majorResponses : (self.response - majorResponses + 0.5) / minorResponses), y : (selectedMajor ? 0 : 1) });
	},
	selectAdjacent : function (direction) {
		var self = Textbox;
		if (self.dialogue.length && self.dialogue[0].responses.length) {
			if (self.response === null)
				self.response = 0;
			else {
				var selectedMajor = (self.response < self.dialogue[0].minorResponses), majorResponses = self.dialogue[0].minorResponses, minorResponses = self.dialogue[0].responses.length - self.dialogue[0].minorResponses;
				switch (direction) {
					case Directions.up:
						self.responsePosition.y = 0;
						break;
					case Directions.down:
						if (minorResponses > 0)
							self.responsePosition.y = 1;
						break;
					case Directions.right:
						self.responsePosition.x += 1 / (selectedMajor ? majorResponses : minorResponses);
						self.responsePosition.x = Math.mod(self.responsePosition.x, 1);
						break;
					case Directions.left:
						self.responsePosition.x -= 1 / (selectedMajor ? majorResponses : minorResponses);
						self.responsePosition.x = Math.mod(self.responsePosition.x, 1);
					break;
				}
				self.response = (self.responsePosition.y === 0 ? roundTo(self.responsePosition.x - 0.5 / majorResponses, 1 / majorResponses) * majorResponses : majorResponses + roundTo(self.responsePosition.x - 0.5 / minorResponses, 1 / minorResponses) * minorResponses);
			}
		}
	},
	key : function (keys) {
		var self = Textbox;
		if (self.dialogue.length && self.dialogue[0].responses.length) {
			if (self.dialogue[0].hotkeys.hasOwnProperty(keys))
				self.selectResponse(self.dialogue[0].hotkeys[keys]);
		}
	},
	update : function () {
		var self = Textbox;
		if (self.pausing && self.pausing()) {
			if (self.after)
				self.after();
			self.pausing = false;
			self.after = null;
		}
		if (self.dialogue.notEmpty()) {
			if (self.slide === 1 && !self.pausing && self.dialogue[0].text !== null) {
				if (self.displayed.length < self.dialogue[0].text.length)
					self.displayed = self.dialogue[0].text.substr(0, self.displayed.length + self.speed);
			}
			// Null text means no text is going to be displayed, and the Textbox is just being used to initiate an event
			if ((self.dialogue[0].text === null || self.displayed.length === self.dialogue[0].text.length) && self.finished === null)
				self.finished = Time.now();
			if (((self.dialogue[0].text === null && Time.now() >= self.finished) || (self.dialogue[0].progress !== "manual" && typeof self.dialogue[0].progress === "number" && Time.now() >= self.finished + self.dialogue[0].progress)) && self.finished !== null) {
				self.progress(true);
				self.finished = null;
			}
			if (self.dialogue[0].progress !== "manual" && typeof self.dialogue[0].progress === "function" && self.dialogue[0].progress() && self.finished !== null) {
				self.progress(true);
			}
			if (/*!self.pausing && */self.slide < 1)
				self.slide += (1 / Time.framerate) * 6;
		}
		if ((/*self.pausing || */!self.dialogue.length) && self.slide > 0)
			self.slide -= (1 / Time.framerate) * 6;
		self.slide = Math.clamp(0, self.slide, 1);
		if (self.slide === 0) {
			self.active = false;
		}
	},
	clear : function () {
		var self = Textbox;
		self.dialogue = [];
		self.displayed = "";
	},
	lineHeight : function () {
		var self = Textbox;
		return (self.height - self.padding * 2) / (self.lines + (self.lines - 1) * self.spacing);
	},
	redraw : function () {
		var self = Textbox;
		var fullHeight = self.height * self.slide, context = Game.canvas.context;
		context.fillStyle = "hsla(0, 0%, 0%, 0.8)";
		if (self.dialogue.length && self.dialogue[0].text === "")
			fullHeight = 0;
		context.fillRect(0, Game.canvas.element.height - fullHeight, Game.canvas.element.width, fullHeight);
		context.textAlign = "left";
		context.textBaseline = "top";
		context.font = "lighter " + self.lineHeight() + "px Helvetica Neue";
		var lines = self.displayed.split("\n");
		for (var line = 0, letters = 0, y, lineWidth, colour = self.colour, colouring; line < lines.length; ++ line) {
			lineWidth = context.measureText(lines[line]).width;
			y = Game.canvas.element.height - fullHeight + self.padding + self.lineHeight() * (1 + self.spacing) * line;
			colouring = context.createLinearGradient(self.padding, y, self.padding + lineWidth, y);
			for (var letter = 0; letter < lines[line].length; ++ letter) {
				colour = self.dialogue[0].colours[letters + letter] || colour;
				if (colour === "default")
					colour = self.colour;
				colouring.addColorStop(context.measureText(lines[line].substr(0, letter)).width / lineWidth, colour);
				colouring.addColorStop(context.measureText(lines[line].substr(0, letter + 1)).width / lineWidth, colour);
			}
			context.fillStyle = colouring;
			context.fillText(lines[line], self.padding, y);
			letters += lines[line].length;
		}
		if (!self.pausing && self.dialogue.length /*&& self.displayed === self.dialogue[0].text*/ && self.dialogue[0].responses.length) {
			var widthMajor = Game.canvas.element.width / self.dialogue[0].minorResponses, minors = (self.dialogue[0].responses.length - self.dialogue[0].minorResponses) > 0, widthMinor;
			if (minors)
				widthMinor = Game.canvas.element.width / (self.dialogue[0].responses.length - self.dialogue[0].minorResponses);
			context.textAlign = "center";
			context.textBaseline = "middle";
			self.hoverResponse = null;
			Game.canvas.element.className = "centre";
			var hovered = Game.cursor.inArea(0, Game.canvas.element.height - fullHeight - Math.round(self.lineHeight() + self.padding * 2), Game.canvas.element.width, Math.round(self.lineHeight() + self.padding * 2));
			for (var response = 0, major, hover, width, height, x, fontSize; response < self.dialogue[0].responses.length; ++ response) {
				major = (response < self.dialogue[0].minorResponses);
				width = Math.ceil(major ? widthMajor : widthMinor);
				height = Math.round(major ? (self.lineHeight() + self.padding * 2) * (minors ? 2 / 3 : 1) : (self.lineHeight() + self.padding * 2) / 3);
				x = Math.ceil(major ? response * width : (response - self.dialogue[0].minorResponses) * width);
				y = Math.round(Game.canvas.element.height - fullHeight - height - (major && minors ? (self.lineHeight() + self.padding * 2) / 3 : 0));
				fontSize = Math.ceil(self.lineHeight() / (major ? 1 : 1.5));
				do {
					context.font = "lighter " + fontSize + "px Helvetica Neue";
					fontSize -= 4;
				} while (context.measureText(self.dialogue[0].responses[response]).width > width);
				hover = Game.cursor.inArea(x, y, width, height) || self.hoverResponse === response || (Game.control.current === Game.control.schemes.keyboard && !hovered && self.response === response);
				if (hover) {
					self.hoverResponse = response;
					if (self.dialogue[0].hasOwnProperty("hover"))
						self.dialogue[0].hover(response, response < self.dialogue[0].minorResponses);
					Game.canvas.element.className = "centre hover";
				}
				context.fillStyle = (hover ? "hsla(0, 0%, 100%, 0.8)" : "hsla(0, 0%, 0%, 0.4)");
				context.fillRect(x, y, width, height);
				context.fillStyle = (hover ? "black" : self.colour);
				context.fillText(self.dialogue[0].responses[response], x + width / 2, y + height / 2);
			}
			if (!hovered) {
				if (self.dialogue[0].hasOwnProperty("hover"))
					self.dialogue[0].hover(null, null);
			}
			if (Game.debug) {
				context.fillStyle = "red";
				context.fillCircle(self.responsePosition.x * Game.canvas.element.width, Math.floor(Game.canvas.element.height - fullHeight - height - ((self.responsePosition.y === 0) && minors ? (self.lineHeight() + self.padding * 2) / 3 : 0)), 4);
			}
		}
	}
};
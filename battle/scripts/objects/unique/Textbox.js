Textbox = {
	active : false,
	slide : 0,
	displayed : "",
	dialogue : [],
	response : null,
	finished : null,
	standardInterval : "manual" || 0 * 0.8 * Time.seconds,
	pausing : false,
	after : null,
	speed : 100,
	padding : 16,
	height : 80,
	lines : 2,
	spacing : 0.5,
	colour : "white",
	say : function (text, progress, trigger, pause, after, now) {
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
		var message = {text : text, colours : colours, responses : [], progress : (arguments.length > 1 && progress !== null ? progress : "manual") , trigger : trigger, pause : pause, after : after};
		self.active = true;
		if (!now) {
			self.dialogue.push(message);
			return self.dialogue.length - 1;
		} else {
			self.dialogue.insert(1, [message]);
			return 1;
		}

	},
	state : function (text, trigger, pause, after, now) {
		var self = Textbox;
		self.say(text, self.standardInterval, trigger, pause, after, now);
	},
	stateNow : function (text, trigger, pause, after) {
		var self = Textbox;
		self.state(text, trigger, pause, after, true);
	},
	effect : function (trigger, pause, after) {
		var self = Textbox;
		self.say(null, self.standardInterval, trigger, pause, after);
	},
	ask : function (query, responses, callback, minors, hover, now) {
		var self = Textbox, latest;
		latest = self.say(query, null, null, null, null, now);
		self.dialogue[latest].responses = responses.concat(minors || []);
		self.dialogue[latest].callback = callback;
		self.dialogue[latest].minorResponses = responses.length;
		if (arguments.length >= 5 && typeof hover !== "undefined" && hover !== null)
			self.dialogue[latest].hover = hover;
	},
	askNow : function (query, responses, callback, minors, hover) {
		var self = Textbox;
		self.ask(query, responses, callback, minors, hover, true);
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
		if (self.pausing || (!automatic && (self.dialogue[0].progress !== "manual" || self.dialogue[0].text === null)))
			return;
		if (self.dialogue[0].text === null || self.displayed.length === self.dialogue[0].text.length) {
			if (self.dialogue[0].responses.length && !automatic) {
				if (self.response !== null) {
					Game.canvas.element.className = "centre";
					self.dialogue[0].callback(self.dialogue[0].responses[self.response], self.response, self.response < self.dialogue[0].minorResponses);
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
		} else
			self.displayed = self.dialogue[0].text;
	},
	update : function () {
		var self = Textbox;
		if (self.pausing && self.pausing()) {
			if (self.after)
				self.after();
			self.pausing = false;
			self.after = null;
		}
		if (self.dialogue.length) {
			if (self.slide === 1 && !self.pausing && self.dialogue[0].text !== null) {
				if (self.displayed.length < self.dialogue[0].text.length)
					self.displayed = self.dialogue[0].text.substr(0, self.displayed.length + self.speed);
			}
			if ((self.dialogue[0].text === null || (self.displayed.length === self.dialogue[0].text.length && self.dialogue[0].progress !== "manual")) && self.finished === null)
				self.finished = Time.now();
			if (((self.dialogue[0].text === null && Time.now() >= self.finished) || (self.dialogue[0].progress !== "manual" && Time.now() >= self.finished + self.dialogue[0].progress)) && self.finished !== null) {
				self.progress(true);
				self.finished = null;
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
		return (Textbox.dialogue.length  === 0);
	},
	lineHeight : function () {
		var self = Textbox;
		return (self.height - self.padding * 2) / (self.lines + (self.lines - 1) * self.spacing);
	},
	redraw : function () {
		var self = Textbox;
		var fullHeight = self.height * self.slide, context = Game.canvas.context;
		context.fillStyle = "hsla(0, 0%, 0%, 0.8)";
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
			var widthMajor = Game.canvas.element.width / self.dialogue[0].minorResponses, minors = self.dialogue[0].responses.length - self.dialogue[0].minorResponses > 0, widthMinor;
			if (minors)
				widthMinor = Game.canvas.element.width / (self.dialogue[0].responses.length - self.dialogue[0].minorResponses);
			context.textAlign = "center";
			context.textBaseline = "middle";
			self.response = null;
			Game.canvas.element.className = "centre";
			var hovered = false;
			for (var response = 0, major, hover, width, height, x, fontSize; response < self.dialogue[0].responses.length; ++ response) {
				major = (response < self.dialogue[0].minorResponses);
				width = Math.ceil(major ? widthMajor : widthMinor);
				height = Math.ceil(major ? (self.lineHeight() + self.padding * 2) * (minors ? 2 / 3 : 1) : (self.lineHeight() + self.padding * 2) / 3);
				x = Math.ceil(major ? response * width : (response - self.dialogue[0].minorResponses) * width);
				y = Math.floor(Game.canvas.element.height - fullHeight - height - (major && minors ? (self.lineHeight() + self.padding * 2) / 3 : 0));
				fontSize = Math.ceil(self.lineHeight() / (major ? 1 : 1.5));
				do {
					context.font = "lighter " + fontSize + "px Helvetica Neue";
					fontSize -= 4;
				} while (context.measureText(self.dialogue[0].responses[response]).width > width);
				hover = Game.cursor.inArea(x, y, width, height);
				if (hover) {
					hovered = true;
					self.response = response;
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
		}
	}
};
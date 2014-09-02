Textbox = {
	active : false,
	slide : 0,
	displayed : "",
	character : 0,
	dialogue : [],
	response : null, // The selected option when a question is asked
	hoverResponse : null, // Which response the cursor is hovering over
	responsePosition : { x : 0, y : 0 }, // Used to allow for much more natural keyboard input
	finished : null,
	standardInterval : "manual"/* 0.8 * Time.seconds */,
	pausing : false,
	after : null,
	scrollSpeed : 1 / (Time.framerate * 0.2),
	appearanceSpeed : 1 / (Time.framerate * 0.2),
	padding : 12,
	height : 80,
	line : 0,
	lines : 2,
	spacing : 0.8,
	colour : "white", // The default text colour
	canvas : null,
	messages : 0,
	namedDialogue : {}, // Allows the textbox to remember the user's last response to dialogue like "Fight, Run, Bag, etc."
	initialise : function () {
		Textbox.canvas = document.createElement("canvas");
		Textbox.canvas.width = Game.canvas.element.width;
		Textbox.canvas.height = Game.canvas.element.height;
		Textbox.canvas.context = Textbox.canvas.getContext("2d");
	},
	currentIndex : function () {
		return Textbox.dialogue.last().id;
	},
	say : function (text, progress, trigger, pause, after, index) {
		/*
			text : The text to display,
			progress : How long to wait after displaying all the text before continuing ("manual" will require input from the user),
			trigger : A function to execute before continuing,
			pause : A condition to wait upon before finishing,
			after : A function to execute after pausing
		*/
		var colours = [];
		if (text !== null) {
			text = "" + text;
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
			text = Textbox.wrap(text);
		}
		var message = {
			id : Textbox.messages ++,
			text : text,
			colours : colours,
			responses : [],
			progress : (arguments.length > 1 && progress !== null ? progress : "manual"),
			trigger : trigger,
			pause : pause,
			after : after
		};
		Textbox.active = true;
		Textbox.dialogue.push(message);
		return message.id;
	},
	insertAfter : function (id, position) {
		var message = Textbox.messageWithId(id), position = Textbox.messageIndexForId(position);
		if (position !== null) {
			Textbox.remove(id);
			Textbox.dialogue.insert(position + 1, message);
			return id;
		} else
			return null;
	},
	messageWithId : function (id) {
		var found = null;
		foreach(Textbox.dialogue, function (message) {
			if (message.id === id) {
				found = message;
				return true;
			}
		});
		return found;
	},
	messageIndexForId : function (id) {
		var found = null;
		foreach(Textbox.dialogue, function (message, i) {
			if (message.id === id) {
				found = i;
				return true;
			}
		});
		return found;
	},
	state : function (text, trigger, pause, after) {
		return Textbox.say(text, Textbox.standardInterval, trigger, pause, after);
	},
	stateUntil : function (text, until) {
		Textbox.say(text, until);
	},
	effect : function (trigger, pause, after) {
		return Textbox.say(null, Textbox.standardInterval, trigger, pause, after);
	},
	ask : function (query, responses, callback, minors, defaultResponse, hotkeys, name, hover, showTextImmediately) {
		var latest;
		latest = Textbox.messageWithId(Textbox.say(query));
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
			if (Textbox.namedDialogue.hasOwnProperty(name)) {
				if (latest.defaultResponse === null) {
					latest.defaultResponse = Textbox.namedDialogue[name];
					latest.defaultResponse = Math.clamp(0, latest.defaultResponse, latest.responses.length - 1);
				}
			} else {
				Textbox.namedDialogue[name] = null;
			}
			latest.name = name;
		}
		if (arguments.length >= 8 && hover !== null && typeof hover !== "undefined")
			latest.hover = hover;
		if (arguments.length >= 9 && showTextImmediately !== null && typeof showTextImmediately !== "undefined")
			latest.showTextImmediately = showTextImmediately;
		if (Textbox.dialogue.length === 1)
			Textbox.prepareNextMessage();
		return latest.id;
	},
	confirm : function (query, callback, minors, defaultResponse, name, hover) {
		var hotkeys = {};
		hotkeys[Game.key.secondary] = "No";
		return Textbox.ask(query, ["No", "Yes"], callback, minors, defaultResponse, hotkeys, name, hover);
	},
	remove : function (id) {
		var found = Textbox.messageIndexForId(id);
		if (found !== null)
			Textbox.dialogue.remove(found);
	},
	removeEffects : function (id) {
		var found = Textbox.messageIndexForId(id);
		if (found !== null) {
			Textbox.dialogue[found].trigger = null;
			Textbox.dialogue[found].pause = null;
			Textbox.dialogue[found].after = null;
			if (Textbox.dialogue[found].text === null)
				Textbox.remove(id);
		}
	},
	wrap : function (text) {
		var context = Textbox.canvas.context;
		context.font = "lighter " + Textbox.lineHeight() + "px Helvetica Neue";
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
			if (width > Textbox.canvas.width - Textbox.padding * 2) {
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
		if (Textbox.dialogue.length === 0 || Textbox.pausing || Textbox.line !== Math.floor(Textbox.line) || (!automatic && (Textbox.dialogue[0].progress !== "manual" || Textbox.dialogue[0].text === null)))
			return;
		if (Textbox.dialogue[0].text === null || (Textbox.line >= Textbox.dialogue[0].text.split("\n").length - Textbox.lines && Textbox.displayed.length === Textbox.dialogue[0].text.length)) {
			if (Textbox.dialogue[0].responses.length && !automatic) {
				var response;
				if (Textbox.hoverResponse !== null || (Game.control.current === Game.control.schemes.keyboard && Textbox.response !== null)) {
					response = (Textbox.hoverResponse !== null ? Textbox.hoverResponse : Textbox.response);
					Game.canvas.element.classList.remove("hover");
					if (Textbox.dialogue[0].hasOwnProperty("name"))
						Textbox.namedDialogue[Textbox.dialogue[0].name] = response;
					Textbox.dialogue[0].callback(Textbox.dialogue[0].responses[response], response, response < Textbox.dialogue[0].minorResponses);
				} else
					return;
			}
			var returned = null;
			if (Textbox.dialogue[0].trigger)
				returned = Textbox.dialogue[0].trigger();
			if (returned !== null && typeof returned === "object" && !Textbox.dialogue[0].pause) {
				Textbox.dialogue[0].pause = function () { return returned.completed; };
			}
			if (Textbox.dialogue[0].pause) {
				Textbox.pausing = Textbox.dialogue[0].pause;
				if (Textbox.dialogue[0].after)
					Textbox.after = Textbox.dialogue[0].after;
			}
			Textbox.dialogue.shift();
			Textbox.displayed = "";
			Textbox.character = 0;
			Textbox.line = 0;
			Text.clear();
			Textbox.prepareNextMessage();
		} else {
			if (Textbox.displayed.split("\n").length - Textbox.lines > Textbox.line)
				Textbox.line += Math.clamp(0, Textbox.scrollSpeed, 1);
		}
	},
	prepareNextMessage : function () {
		if (Textbox.dialogue.notEmpty()) {
			if (Textbox.dialogue[0].responses.length)
				// Select default response
				Textbox.selectResponse(Textbox.dialogue[0].defaultResponse !== null ? Textbox.dialogue[0].defaultResponse : 0);
			if (Textbox.dialogue[0].showTextImmediately)
				Textbox.character = Textbox.dialogue[0].text.length - 1;
		}
	},
	selectResponse : function (response) {
		Textbox.response = response;
		var selectedMajor = (Textbox.response < Textbox.dialogue[0].minorResponses), majorResponses = Textbox.dialogue[0].minorResponses, minorResponses = Textbox.dialogue[0].responses.length - Textbox.dialogue[0].minorResponses;
		Textbox.responsePosition = (Textbox.response === null ? { x : null, y : null} : { x : (selectedMajor ? (Textbox.response + 0.5) / majorResponses : (Textbox.response - majorResponses + 0.5) / minorResponses), y : (selectedMajor ? 0 : 1) });
	},
	selectAdjacent : function (direction) {
		if (Textbox.dialogue.length && Textbox.dialogue[0].responses.length) {
			if (Textbox.response === null)
				Textbox.response = 0;
			else {
				var selectedMajor = (Textbox.response < Textbox.dialogue[0].minorResponses), majorResponses = Textbox.dialogue[0].minorResponses, minorResponses = Textbox.dialogue[0].responses.length - Textbox.dialogue[0].minorResponses;
				switch (direction) {
					case Directions.up:
						Textbox.responsePosition.y = 0;
						break;
					case Directions.down:
						if (minorResponses > 0)
							Textbox.responsePosition.y = 1;
						break;
					case Directions.right:
						Textbox.responsePosition.x += 1 / (selectedMajor ? majorResponses : minorResponses);
						Textbox.responsePosition.x = Math.mod(Textbox.responsePosition.x, 1);
						break;
					case Directions.left:
						Textbox.responsePosition.x -= 1 / (selectedMajor ? majorResponses : minorResponses);
						Textbox.responsePosition.x = Math.mod(Textbox.responsePosition.x, 1);
					break;
				}
				Textbox.response = (Textbox.responsePosition.y === 0 ? roundTo(Textbox.responsePosition.x - 0.5 / majorResponses, 1 / majorResponses) * majorResponses : majorResponses + roundTo(Textbox.responsePosition.x - 0.5 / minorResponses, 1 / minorResponses) * minorResponses);
			}
		}
	},
	key : function (keys) {
		if (Textbox.dialogue.length && Textbox.dialogue[0].responses.length) {
			if (Textbox.dialogue[0].hotkeys.hasOwnProperty(keys))
				Textbox.selectResponse(Textbox.dialogue[0].hotkeys[keys]);
		}
	},
	update : function () {
		if (Textbox.pausing && Textbox.pausing()) {
			if (Textbox.after)
				Textbox.after();
			Textbox.pausing = false;
			Textbox.after = null;
		}
		if (Textbox.dialogue.notEmpty()) {
			if (Textbox.slide === 1 && !Textbox.pausing && Textbox.dialogue[0].text !== null) {
				if (Textbox.displayed.length < Textbox.dialogue[0].text.length) {
					var maxLength = 0;
					foreach(Textbox.dialogue[0].text.split("\n"), function (line, number) {
						if (number - 2 >= Math.floor(Textbox.line))
							return true;
						maxLength += line.length + 1;
					});
					Textbox.character += Settings._("text speed");
					if (Textbox.character + 1 < Textbox.dialogue[0].text.length) {
						if (Textbox.dialogue[0].text[Textbox.character + 1] === "\n") // If the next character is a newline, display that immediately to prevent unresponsiveness
							++ Textbox.character;
					}
					Textbox.character = Math.clamp(0, Textbox.character, Math.min(maxLength, Textbox.dialogue[0].text.length));
					Textbox.displayed = Textbox.dialogue[0].text.substr(0, Math.floor(Textbox.character));
				}
			}
			// Null text means no text is going to be displayed, and the Textbox is just being used to initiate an event
			if ((Textbox.dialogue[0].text === null || Textbox.displayed.length === Textbox.dialogue[0].text.length || Textbox.dialogue[0].text.split("\n").length - Textbox.lines > Textbox.line) && Textbox.finished === null) {
				Textbox.finished = Time.now();
			}
			if (((Textbox.dialogue[0].text === null && Time.now() >= Textbox.finished) || (Textbox.dialogue[0].progress !== "manual" && typeof Textbox.dialogue[0].progress === "number" && Time.now() >= Textbox.finished + Textbox.dialogue[0].progress)) && Textbox.finished !== null) {
				Textbox.progress(true);
				Textbox.finished = null;
			} else if (Textbox.dialogue[0].progress !== "manual" && typeof Textbox.dialogue[0].progress === "function" && Textbox.dialogue[0].progress() && Textbox.finished !== null) {
				Textbox.progress(true);
				Textbox.finished = null;
			}
			if (Textbox.slide < 1)
				Textbox.slide += Textbox.appearanceSpeed;
			if (Textbox.slide === 1 && Textbox.line !== Math.floor(Textbox.line))
				Textbox.line = Math.clamp(Math.floor(Textbox.line), Textbox.line + Textbox.scrollSpeed, Math.floor(Textbox.line) + 1);
		}
		if (!Textbox.dialogue.length && Textbox.slide > 0)
			Textbox.slide -= Textbox.appearanceSpeed;
		Textbox.slide = Math.clamp(0, Textbox.slide, 1);
		if (Textbox.slide === 0) {
			Textbox.active = false;
		}
	},
	clear : function () {
		Textbox.dialogue = [];
		Textbox.displayed = "";
		Textbox.line = 0;
		Textbox.character = 0;
	},
	lineHeight : function () {
		return (Textbox.height - Textbox.padding * 2) / (Textbox.lines + (Textbox.lines - 1) * Textbox.spacing);
	},
	redraw : function () {
		var fullHeight = Textbox.height * Textbox.slide, context = Textbox.canvas.context;
		context.clearRect(0, 0, Textbox.canvas.width, Textbox.canvas.height);
		context.fillStyle = "hsla(0, 0%, 0%, 0.8)";
		context.fillRect(0, Textbox.canvas.height - fullHeight, Textbox.canvas.width, fullHeight);
		context.textAlign = "left";
		context.textBaseline = "top";
		context.font = "lighter " + Textbox.lineHeight() + "px Helvetica Neue";
		var lines = Textbox.displayed.split("\n");
		for (var line = 0, letters = 0, y, lineWidth, colour = Textbox.colour, colouring; line < lines.length; ++ line) {
			lineWidth = context.measureText(lines[line]).width;
			y = Textbox.canvas.height - fullHeight + Textbox.padding + Textbox.lineHeight() * (1 + Textbox.spacing) * (line - Textbox.line);
			colouring = context.createLinearGradient(Textbox.padding, y, Textbox.padding + lineWidth, y);
			for (var letter = 0; letter < lines[line].length; ++ letter) {
				colour = Textbox.dialogue[0].colours[letters + letter] || colour;
				if (colour === "default")
					colour = Textbox.colour;
				colouring.addColorStop(context.measureText(lines[line].substr(0, letter)).width / lineWidth, colour);
				colouring.addColorStop(context.measureText(lines[line].substr(0, letter + 1)).width / lineWidth, colour);
			}
			context.fillStyle = colouring;
			//context.fillText(lines[line], Textbox.padding, y);
			context.font = Math.pow(2, Math.round(Math.log(Textbox.lineHeight()) / Math.log(2))) + "px HGSS";
			Text.draw(Textbox.canvas, lines[line], Textbox.padding, y, "Textbox:" + line);
			letters += lines[line].length;
		}
		context.clearRect(0, 0, Textbox.canvas.width, Textbox.canvas.height - fullHeight);
		if (!Textbox.pausing && Textbox.dialogue.length && Textbox.displayed === Textbox.dialogue[0].text && Textbox.dialogue[0].responses.length) {
			var widthMajor = Textbox.canvas.width / Textbox.dialogue[0].minorResponses, minors = (Textbox.dialogue[0].responses.length - Textbox.dialogue[0].minorResponses) > 0, widthMinor;
			if (minors)
				widthMinor = Textbox.canvas.width / (Textbox.dialogue[0].responses.length - Textbox.dialogue[0].minorResponses);
			context.textAlign = "center";
			context.textBaseline = "middle";
			Textbox.hoverResponse = null;
			Game.canvas.element.classList.remove("hover");
			var hovered = Game.cursor.inArea(0, Textbox.canvas.height - fullHeight - Math.round(Textbox.lineHeight() + Textbox.padding * 2), Textbox.canvas.width, Math.round(Textbox.lineHeight() + Textbox.padding * 2));
			if (hovered)
				Game.canvas.element.classList.add("hover");
			for (var response = 0, major, selected, hover, width, height, x, fontSize; response < Textbox.dialogue[0].responses.length; ++ response) {
				major = (response < Textbox.dialogue[0].minorResponses);
				width = Math.ceil(major ? widthMajor : widthMinor);
				height = Math.round(major ? (Textbox.lineHeight() + Textbox.padding * 2) * (minors ? 2 / 3 : 1) : (Textbox.lineHeight() + Textbox.padding * 2) / 3);
				x = Math.ceil(major ? response * width : (response - Textbox.dialogue[0].minorResponses) * width);
				y = Math.round(Textbox.canvas.height - fullHeight - height - (major && minors ? (Textbox.lineHeight() + Textbox.padding * 2) / 3 : 0));
				fontSize = Math.ceil(Textbox.lineHeight() / (major ? 1 : 1.5));
				do {
					context.font = "lighter " + fontSize + "px Helvetica Neue";
					fontSize -= 4;
				} while (context.measureText(Textbox.dialogue[0].responses[response]).width > width);
				selected = (hover = Game.cursor.inArea(x, y, width, height)) || (Game.control.current === Game.control.schemes.keyboard && !hovered && Textbox.response === response);
				if (selected) {
					if (hover)
						Textbox.hoverResponse = response;
					if (Textbox.dialogue[0].hasOwnProperty("hover"))
						Textbox.dialogue[0].hover(response, response < Textbox.dialogue[0].minorResponses);
				}
				context.fillStyle = (selected ? "hsla(0, 0%, 100%, 0.8)" : "hsla(0, 0%, 0%, 0.4)");
				context.fillRect(x, y, width, height);
				context.fillStyle = (selected ? "black" : Textbox.colour);
				//context.fillText(Textbox.dialogue[0].responses[response], x + width / 2, y + height / 2);
				context.font = Math.pow(2, Math.round(Math.log(fontSize) / Math.log(2))) + "px HGSS";
				Text.draw(Textbox.canvas, Textbox.dialogue[0].responses[response], x + width / 2, y + height / 2, "Response:" + response);
			}
			if (!selected) {
				if (Textbox.dialogue[0].hasOwnProperty("hover"))
					Textbox.dialogue[0].hover(null, null);
			}
			if (Settings._("debug mode")) {
				context.fillStyle = "red";
				context.fillCircle(Textbox.responsePosition.x * Textbox.canvas.width, Math.floor(Textbox.canvas.height - fullHeight - height - ((Textbox.responsePosition.y === 0) && minors ? (Textbox.lineHeight() + Textbox.padding * 2) / 3 : 0)), 4);
			}
		}
		Game.canvas.context.drawImage(Textbox.canvas, 0, Game.canvas.element.height - Textbox.canvas.height);
	}
};
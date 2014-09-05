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
	padding : {
		horizontal : 12,
		vertical : 12
	},
	lineHeight : 18,
	height : 80,
	lowestVisibleLine : null,
	spacing : 0.6,
	colour : "white", // The default text colour
	canvas : null,
	measurement : null,
	messages : 0,
	namedDialogue : {}, // Allows the textbox to remember the user's last response to dialogue like "Fight, Run, Bag, etc."
	initialise : function () {
		Textbox.canvas = document.querySelector("#game-textbox");
		Textbox.canvas.width = Game.canvas.element.width;
		Textbox.canvas.height = Game.canvas.element.height;
		Textbox.canvas.context = Textbox.canvas.getContext("2d");
		Textbox.measurement = document.createElement("div");
		Textbox.measurement.style.opacity = 0;
		Textbox.measurement.style.position = "absolute";
		document.body.appendChild(Textbox.measurement);
	},
	currentIndex : function () {
		return Textbox.dialogue.last().id;
	},
	say : function (text, progress, trigger, pause, after, index) {
		/*
			text : The text to display,
				The text is a normal JavaScript string, optionally containing certain command tags:
				<TAG-NAME-HERE: TAG-VALUE-HERE> makes all text after that tag have that value
				<TAG-NAME-HERE:> makes all text after that tag have the value of the previous tag (tags stack)
				<TAG-NAME-HERE::> makes all text after that tag have the default value for that tag

				<colour: COLOUR-NAME-HERE> will make all text after that tag coloured
				<size: SIZE-IN-PIXELS-HERE> will make all text after that tag a different size
			progress : How long to wait after displaying all the text before continuing ("manual" will require input from the user),
			trigger : A function to execute before continuing,
			pause : A condition to wait upon before finishing,
			after : A function to execute after pausing
		*/
		var styling = {}, commands = {
			"colour" : {
				type : "string"
			},
			"size" : {
				type : "number"
			}
		};
		forevery(commands, function (settings, command) {
			styling[command] = {};
		});
		if (text !== null) {
			text = "" + text;
			console.log(text);
			var regex, exclusive, position, value = null, previousValue, valueStack = [];
			forevery(commands, function (settings, command) {
				regex = new RegExp("<" + command + ": ?(.*?)>", "i");
				exclusive = text;
				forevery(commands, function (__, exclude) {
					if (exclude === command)
						return;
					exclusive = exclusive.replace(new RegExp("<" + exclude + ": ?(.*?)>", "gi"), "");
				});
				while ((position = exclusive.search(regex)) > -1) {
					previousValue = value;
					value = regex.exec(exclusive)[1];
					if (value === "" && valueStack.notEmpty())
						value = valueStack.pop();
					else if (value === ":" || (value === "" && valueStack.empty()))
						value = "default";
					else if (previousValue)
						valueStack.push(previousValue);
					styling[command][position] = value;
					if (styling[command][position] !== "default") {
						switch (settings.type) {
							case "string":
								break;
							case "number":
								styling[command][position] = parseFloat(styling[command][position]);
								break;
						}
					}
					exclusive = exclusive.replace(regex, "");
				}
				text = text.replace(new RegExp(regex.source, "gi"), "");
			});
			text = Textbox.wrap(text, styling);
		}
		var message = {
			id : Textbox.messages ++,
			text : text,
			styling : styling,
			responses : [],
			progress : (arguments.length > 1 && progress !== null ? progress : "manual"),
			trigger : trigger,
			pause : pause,
			after : after
		};
		Textbox.active = true;
		Textbox.dialogue.push(message);
		if (Textbox.dialogue.length === 1)
			Textbox.prepareNextMessage();
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
		var latest  = Textbox.messageWithId(Textbox.say(query));
		responses = wrapArray(responses);
		minors = wrapArray(minors);
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
	wrap : function (text, styling) {
		var context = Textbox.canvas.context;
		context.font = Font.load(Textbox.lineHeight);
		for (var i = 0, width = 0, character, breakpoint = null, softBreakpoint = null; i < text.length; ++ i) {
			character = text[i];
			if (character === "\n") {
				breakpoint = softBreakpoint = null;
				width = 0;
				continue;
			}
			if (/\s/.test(character))
				breakpoint = i;
			if (styling["size"].hasOwnProperty(i)) {
				var size = styling["size"][i];
				context.font = Font.load(size !== "default" ? size : Textbox.lineHeight);
			}
			width += context.measureText(text[i]).width;
			if (width > Textbox.canvas.width - Textbox.padding.horizontal * 2) {
				if (breakpoint) {
					text = text.substr(0, breakpoint) + "\n" + text.substr(breakpoint + 1);
					i = breakpoint;
					breakpoint = softBreakpoint = null;
					width = 0;
				} else if (softBreakpoint) {
					text = text.substr(0, softBreakpoint + 1) + "-\n" + text.substr(softBreakpoint + 1);
					i = softBreakpoint;
					breakpoint = softBreakpoint = null;
					width = 0;
				}
			} else if (width + context.measureText("-").width <= Textbox.canvas.width - Textbox.padding.horizontal * 2) {
				softBreakpoint = i;
			}
		}
		return text;
	},
	splitAtPositions : function (string, positions, offset) {
		var strings = [], previousPosition = 0;
		foreach(positions, function (position) {
			if (position - offset <= string.length) {
				if (position - offset >= 0)
					strings.push(string.substring(previousPosition - offset, (previousPosition = position) - offset));
			} else
				return true;
		});
		strings.push(string.substring(previousPosition - offset));
		return strings;
	},
	heightsOfLines : function () {
		if (Textbox.dialogue.notEmpty() && Textbox.dialogue.first().text !== null) {
			var lines = Textbox.dialogue.first().text.split("\n"), partitionPositions = [], partitions, characters = 0;
			forevery(Textbox.dialogue.first().styling["size"], function (size, position) {
				partitionPositions.push(parseInt(position));
			});
			var current = {
				size : Textbox.lineHeight
			}, lineHeights = [];
			foreach(lines, function (line, lineNumber) {
				partitions = Textbox.splitAtPositions(line, partitionPositions, characters);
				var maximumPartitionHeight = 0;
				foreach(partitions, function (part) {
					Textbox.measurement.innerHTML = "";
					var size = Textbox.dialogue.first().styling["size"].hasOwnProperty(characters) ? Textbox.dialogue.first().styling["size"][characters] : current["size"];
					Textbox.measurement.style.font = Font.load(current["size"] = (size !== "default" ? size : Textbox.lineHeight));
					Textbox.measurement.appendChild(document.createTextNode(part));
					maximumPartitionHeight = Math.max(maximumPartitionHeight, Textbox.measurement.getBoundingClientRect().height);
					characters += part.length;
				});
				lineHeights.push(maximumPartitionHeight);
			});
			return lineHeights;
		}
		return [];
	},
	linesCurrentlyVisible : function (descending) {
		if (Textbox.dialogue.notEmpty() && Textbox.dialogue.first().text !== null) {
			var lineHeights = Textbox.heightsOfLines(), visibleLines = 0, cumulativeHeight = lineHeights[Math.ceil(Textbox.lowestVisibleLine)] * (Textbox.lowestVisibleLine - Math.floor(Textbox.lowestVisibleLine)), totalHeight = sum(lineHeights, Textbox.lowestVisibleLine + 1);
			if (cumulativeHeight <= Textbox.height * Math.pow(2, Game.zoom - 1) - Textbox.padding.vertical * 2) {
				visibleLines += Textbox.lowestVisibleLine - Math.floor(Textbox.lowestVisibleLine);
				for (var i = Math.floor(Textbox.lowestVisibleLine); (descending ? i < lineHeights.length : i >= 0); i += (descending ? 1 : -1)) {
					if ((cumulativeHeight += lineHeights[i]) <= Textbox.height * Math.pow(2, Game.zoom - 1) - Textbox.padding.vertical * 2)
						++ visibleLines;
					else
						break;
				}
			}
			return {
				visibleLines : visibleLines,
				cumulativeHeight : cumulativeHeight,
				totalHeight : totalHeight
			};
		}
		return 0;
	},
	progress : function (automatic) {
		if (Textbox.dialogue.length === 0 || Textbox.pausing || Textbox.lowestVisibleLine !== Math.floor(Textbox.lowestVisibleLine) || (!automatic && (Textbox.dialogue.first().progress !== "manual" || Textbox.dialogue.first().text === null)))
			return;
		if (Textbox.dialogue.first().text === null || (Textbox.lowestVisibleLine === Textbox.dialogue.first().text.split("\n").length - 1 && Textbox.displayed.length === Textbox.dialogue.first().text.length)) {
			if (Textbox.dialogue.first().responses.length && !automatic) {
				var response;
				if (Textbox.hoverResponse !== null || (Game.control.current === Game.control.schemes.keyboard && Textbox.response !== null)) {
					response = (Textbox.hoverResponse !== null ? Textbox.hoverResponse : Textbox.response);
					Game.canvas.element.classList.remove("hover");
					if (Textbox.dialogue.first().hasOwnProperty("name"))
						Textbox.namedDialogue[Textbox.dialogue.first().name] = response;
					Textbox.dialogue.first().callback(Textbox.dialogue.first().responses[response], response, response < Textbox.dialogue.first().minorResponses);
				} else
					return;
			}
			var returned = null;
			if (Textbox.dialogue.first().trigger)
				returned = Textbox.dialogue.first().trigger();
			if (returned !== null && typeof returned === "object" && !Textbox.dialogue.first().pause) {
				Textbox.dialogue.first().pause = function () { return returned.completed; };
			}
			if (Textbox.dialogue.first().pause) {
				Textbox.pausing = Textbox.dialogue.first().pause;
				if (Textbox.dialogue.first().after)
					Textbox.after = Textbox.dialogue.first().after;
			}
			Textbox.dialogue.shift();
			Textbox.displayed = "";
			Textbox.character = 0;
			Textbox.prepareNextMessage();
		} else {
			if (Textbox.displayed.split("\n").length - 1 > Textbox.lowestVisibleLine)
				Textbox.lowestVisibleLine += Math.clamp(0, Textbox.scrollSpeed, 1);
		}
	},
	prepareNextMessage : function () {
		if (Textbox.dialogue.notEmpty()) {
			if (Textbox.dialogue.first().text !== null) {
				if (Textbox.dialogue.first().responses.length)
					// Select default response
					Textbox.selectResponse(Textbox.dialogue.first().defaultResponse !== null ? Textbox.dialogue.first().defaultResponse : 0);
				if (Textbox.dialogue.first().showTextImmediately)
					Textbox.character = Textbox.dialogue.first().text.length - 1;
				Textbox.lowestVisibleLine = 0;
				Textbox.lowestVisibleLine = Math.max(0, Textbox.linesCurrentlyVisible(true).visibleLines - 1);
			}
		}
	},
	selectResponse : function (response) {
		Textbox.response = response;
		var selectedMajor = (Textbox.response < Textbox.dialogue.first().minorResponses), majorResponses = Textbox.dialogue.first().minorResponses, minorResponses = Textbox.dialogue.first().responses.length - Textbox.dialogue.first().minorResponses;
		Textbox.responsePosition = (Textbox.response === null ? { x : null, y : null} : { x : (selectedMajor ? (Textbox.response + 0.5) / majorResponses : (Textbox.response - majorResponses + 0.5) / minorResponses), y : (selectedMajor ? 0 : 1) });
	},
	selectAdjacent : function (direction) {
		if (Textbox.dialogue.length && Textbox.dialogue.first().responses.length) {
			if (Textbox.response === null)
				Textbox.response = 0;
			else {
				var selectedMajor = (Textbox.response < Textbox.dialogue.first().minorResponses), majorResponses = Textbox.dialogue.first().minorResponses, minorResponses = Textbox.dialogue.first().responses.length - Textbox.dialogue.first().minorResponses;
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
		if (Textbox.dialogue.length && Textbox.dialogue.first().responses.length) {
			if (Textbox.dialogue.first().hotkeys.hasOwnProperty(keys))
				Textbox.selectResponse(Textbox.dialogue.first().hotkeys[keys]);
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
			if (Textbox.slide === 1 && !Textbox.pausing && Textbox.dialogue.first().text !== null) {
				if (Textbox.displayed.length < Textbox.dialogue.first().text.length) {
					var maxLength = 0;
					foreach(Textbox.dialogue.first().text.split("\n"), function (line, number) {
						if (number > Math.floor(Textbox.lowestVisibleLine))
							return true;
						maxLength += line.length + 1;
					});
					Textbox.character += Settings._("text speed");
					if (Textbox.character + 1 < Textbox.dialogue.first().text.length) {
						if (Textbox.dialogue.first().text[Textbox.character + 1] === "\n") // If the next character is a newline, display that immediately to prevent unresponsiveness
							++ Textbox.character;
					}
					Textbox.character = Math.clamp(0, Textbox.character, Math.min(maxLength, Textbox.dialogue.first().text.length));
					Textbox.displayed = Textbox.dialogue.first().text.substr(0, Math.floor(Textbox.character));
				}
			}
			// Null text means no text is going to be displayed, and the Textbox is just being used to initiate an event
			if ((Textbox.dialogue.first().text === null || Textbox.displayed.length === Textbox.dialogue.first().text.length || Textbox.dialogue.first().text.split("\n").length - 1 === Textbox.lowestVisibleLine) && Textbox.finished === null) {
				Textbox.finished = Time.now();
			}
			if (((Textbox.dialogue.first().text === null && Time.now() >= Textbox.finished) || (Textbox.dialogue.first().progress !== "manual" && typeof Textbox.dialogue.first().progress === "number" && Time.now() >= Textbox.finished + Textbox.dialogue.first().progress)) && Textbox.finished !== null) {
				Textbox.progress(true);
				Textbox.finished = null;
			} else if (Textbox.dialogue.first().progress !== "manual" && typeof Textbox.dialogue.first().progress === "function" && Textbox.dialogue.first().progress() && Textbox.finished !== null) {
				Textbox.progress(true);
				Textbox.finished = null;
			}
			if (Textbox.slide < 1)
				Textbox.slide += Textbox.appearanceSpeed;
			if (Textbox.slide === 1 && Textbox.lowestVisibleLine !== Math.floor(Textbox.lowestVisibleLine))
				Textbox.lowestVisibleLine = Math.clamp(Math.floor(Textbox.lowestVisibleLine), Textbox.lowestVisibleLine + Textbox.scrollSpeed, Math.floor(Textbox.lowestVisibleLine) + 1);
		}
		if (Textbox.dialogue.empty() && Textbox.slide > 0)
			Textbox.slide -= Textbox.appearanceSpeed;
		Textbox.slide = Math.clamp(0, Textbox.slide, 1);
		if (Textbox.slide === 0) {
			Textbox.active = false;
		}
	},
	clear : function () {
		Textbox.dialogue = [];
		Textbox.displayed = "";
		Textbox.character = 0;
	},
	redraw : function () {
		var fullHeight = Textbox.height * Math.pow(2, Game.zoom - 1) * Textbox.slide, context = Textbox.canvas.context;
		context.clearRect(0, 0, Textbox.canvas.width, Textbox.canvas.height);
		context.fillStyle = "hsla(0, 0%, 0%, 0.8)";
		context.fillRect(0, Textbox.canvas.height - fullHeight, Textbox.canvas.width, fullHeight);
		if (Settings._("debug mode")) {
			context.fillStyle = "hsl(0, 0%, 20%)";
			context.fillRect(Textbox.padding.horizontal, Textbox.canvas.height - fullHeight + Textbox.padding.vertical, Textbox.canvas.width - Textbox.padding.horizontal * 2, fullHeight - Textbox.padding.vertical * 2);
		}
		context.textAlign = "left";
		context.textBaseline = "alphabetic";
		context.font = Font.load(Textbox.lineHeight);
		if (Textbox.dialogue.notEmpty() && Textbox.dialogue.first().text !== null) {
			var lines = Textbox.displayed.split("\n"), partitionPositions = [], partitions, characters = 0;
			forevery(Textbox.dialogue.first().styling["size"], function (size, position) {
				partitionPositions.push(parseInt(position));
			});
			var position = {
				x : 0
			}, current = {
				size : Textbox.lineHeight,
				colour : Textbox.colour
			}, lineHeights = Textbox.heightsOfLines(), currentLineStatistics = Textbox.linesCurrentlyVisible();
			lines = Textbox.displayed.split("\n");
			foreach(lines, function (line, lineNumber) {
				partitions = Textbox.splitAtPositions(line, partitionPositions, characters);
				foreach(partitions, function (part) {
					var size, colouring, partitionWidth, verticalPosition = Textbox.canvas.height - Textbox.padding.vertical - currentLineStatistics.totalHeight - (currentLineStatistics.totalHeight < Textbox.height * Math.pow(2, Game.zoom - 1) - Textbox.padding.vertical * 2 ? Textbox.height * Math.pow(2, Game.zoom - 1) - Textbox.padding.vertical * 2 - currentLineStatistics.cumulativeHeight : 0) + sum(lineHeights, lineNumber + 1);
					size = Textbox.dialogue.first().styling["size"].hasOwnProperty(characters) ? Textbox.dialogue.first().styling["size"][characters] : current["size"];
					context.font = Font.load(current["size"] = (size !== "default" ? size : Textbox.lineHeight));
					partitionWidth = context.measureText(part).width;
					colouring = context.createLinearGradient(Textbox.padding.horizontal, verticalPosition, Textbox.padding.horizontal + partitionWidth, verticalPosition);
					for (var character = 0, colour; character < part.length; ++ character) {
						colour = Textbox.dialogue.first().styling["colour"].hasOwnProperty(characters + character) ? Textbox.dialogue.first().styling["colour"][characters + character] : current["colour"];
						if (colour === "default")
							colour = Textbox.colour;
						current["colour"] = colour;
						colouring.addColorStop(context.measureText(part.substr(0, character)).width / partitionWidth, colour);
						colouring.addColorStop(context.measureText(part.substr(0, character + 1)).width / partitionWidth, colour);
					}
					context.fillStyle = colouring;
					context.fillText(part, Textbox.padding.horizontal + position.x, verticalPosition);
					position.x += partitionWidth;
					characters += part.length;
				});
				position.x = 0;
				characters += 1; // The newline character, which has been removed.
			});
		}
		context.clearRect(0, 0, Textbox.canvas.width, Textbox.canvas.height - fullHeight);
		if (!Textbox.pausing && Textbox.dialogue.length && Textbox.displayed === Textbox.dialogue.first().text && Textbox.dialogue.first().responses.length) {
			var widthMajor = Textbox.canvas.width / Textbox.dialogue.first().minorResponses, minors = (Textbox.dialogue.first().responses.length - Textbox.dialogue.first().minorResponses) > 0, widthMinor;
			if (minors)
				widthMinor = Textbox.canvas.width / (Textbox.dialogue.first().responses.length - Textbox.dialogue.first().minorResponses);
			context.textAlign = "center";
			context.textBaseline = "middle";
			Textbox.hoverResponse = null;
			Game.canvas.element.classList.remove("hover");
			var hovered = Game.cursor.inArea(0, Textbox.canvas.height - fullHeight - Math.round(Textbox.lineHeight + Textbox.padding.vertical * 2), Textbox.canvas.width, Math.round(Textbox.lineHeight + Textbox.padding.vertical * 2));
			if (hovered)
				Game.canvas.element.classList.add("hover");
			for (var response = 0, major, selected, hover, width, height, x, fontSize; response < Textbox.dialogue.first().responses.length; ++ response) {
				major = (response < Textbox.dialogue.first().minorResponses);
				width = Math.ceil(major ? widthMajor : widthMinor);
				height = Math.round(major ? (Textbox.lineHeight + Textbox.padding.vertical * 2) * (minors ? 2 / 3 : 1) : (Textbox.lineHeight + Textbox.padding.vertical * 2) / 3);
				x = Math.ceil(major ? response * width : (response - Textbox.dialogue.first().minorResponses) * width);
				y = Math.round(Textbox.canvas.height - fullHeight - height - (major && minors ? (Textbox.lineHeight + Textbox.padding.vertical * 2) / 3 : 0));
				fontSize = Math.ceil(Textbox.lineHeight / (major ? 1 : 1.8));
				do {
					context.font = Font.load(fontSize);
					fontSize -= 4;
				} while (context.measureText(Textbox.dialogue.first().responses[response]).width > width);
				selected = (hover = Game.cursor.inArea(x, y, width, height)) || (Game.control.current === Game.control.schemes.keyboard && !hovered && Textbox.response === response);
				if (selected) {
					if (hover)
						Textbox.hoverResponse = response;
					if (Textbox.dialogue.first().hasOwnProperty("hover"))
						Textbox.dialogue.first().hover(response, response < Textbox.dialogue.first().minorResponses);
				}
				context.fillStyle = (selected ? "hsla(0, 0%, 100%, 0.8)" : "hsla(0, 0%, 0%, 0.4)");
				context.fillRect(x, y, width, height);
				context.fillStyle = (selected ? "black" : Textbox.colour);
				context.fillText(Textbox.dialogue.first().responses[response], x + width / 2, y + height / 2);
			}
			if (!hovered) {
				if (Textbox.dialogue.first().hasOwnProperty("hover"))
					Textbox.dialogue.first().hover(null, null);
			}
			if (Settings._("debug mode")) {
				context.fillStyle = "red";
				context.fillCircle(Textbox.responsePosition.x * Textbox.canvas.width, Math.floor(Textbox.canvas.height - fullHeight - height - ((Textbox.responsePosition.y === 0) && minors ? (Textbox.lineHeight + Textbox.padding.vertical * 2) / 3 : 0)), 4);
			}
		}
	}
};
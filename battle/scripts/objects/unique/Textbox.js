Textbox = {
	active : false,
	slide : 0,
	displayed : "",
	character : 0,
	dialogue : [],
	response : null, // The selected option when a question is asked
	hoverResponse : null, // Which response the cursor is hovering over
	responsePosition : { x : 0, y : 0 }, // Used to allow for much more natural keyboard input
	style : "standard",
	styles : {
		"standard" : {
			height : 66,
			lineHeight : 16,
			lineSpacing : 0.44,
			padding : {
				horizontal : 12,
				vertical : 8
			},
			margin : {
				horizontal : 0,
				vertical : 10
			}
		},
		"standard (question)" : {
			height : 64,
			lineHeight : 16,
			lineSpacing : 0.44,
			responsesPerRow : 3,
			buttonProportion : 0.8,
			padding : {
				horizontal : 12,
				vertical : 8
			},
			margin : {
				horizontal : 0,
				vertical : 10
			}
		},
		"battle" : {
			height : 80,
			lineHeight : 18,
			lineSpacing : 0.7,
			padding : {
				horizontal : 12,
				vertical : 12
			},
			margin : {
				horizontal : 0,
				vertical : 0
			}
		},
		"battle (question)" : {
			height : 32,
			lineHeight : 10,
			lineSpacing : 0.7,
			responsesPerRow : 2,
			buttonProportion : 0.6,
			padding : {
				horizontal : 12,
				vertical : 12
			},
			margin : {
				horizontal : 0,
				vertical : 0
			}
		}
	},
	finished : null,
	standardInterval : "manual"/* 0.8 * Time.seconds */,
	pausing : false,
	after : null,
	scrollSpeed : 1 / (Time.framerate * 0.2),
	appearanceSpeed : 1 / (Time.framerate * 0.2),
	lowestVisibleLine : null,
	canvas : null,
	measurement : null,
	messages : 0,
	namedDialogue : {}, // Allows the textbox to remember the user's last response to dialogue like "Fight, Run, Bag, etc."
	commands : {
		"colour" : {
			type : "string",
			default : "white"
		},
		"size" : {
			type : "number",
			default : function (style) {
				return (style || Textbox.currentStyle()).lineHeight;
			}
		},
		"weight" : {
			type : "string",
			default : function () {
				return Settings._("font => weight");
			}
		},
		"style" : {
			type : "string",
			default : ""
		}
	},
	setStyle : function (style) {
		Textbox.style = style;
	},
	currentStyle : function () {
		if (Textbox.dialogue.notEmpty()) {
			return Textbox.styles._(Textbox.dialogue.first().style);
		}
		else {
			return Textbox.styles._(Textbox.style);
		}
	},
	metrics : function (style) {
		if (arguments.length < 1)
			style = Textbox.currentStyle();
		var metrics = {
			left : style.margin.horizontal,
			top : null, // Calculate top after height
			width : Textbox.canvas.width - style.margin.horizontal * 2,
			height : style.height * Math.pow(2, Game.zoom - 1),
			inner : {
				left : style.margin.horizontal + style.padding.horizontal,
				top : null,
				width : Textbox.canvas.width - (style.margin.horizontal + style.padding.horizontal) * 2,
				height : style.height * Math.pow(2, Game.zoom - 1) - style.padding.vertical * 2
			}
		};
		metrics.top = Textbox.canvas.height - (style.margin.vertical + metrics.height) * Textbox.slide;
		if (Textbox.dialogue.notEmpty() && Textbox.dialogue.first().responses.notEmpty()) {
			metrics.response = {
				major : {
					height : Math.round((style.lineHeight + style.padding.vertical * 2) * style.buttonProportion)
				},
				minor : {
					height : Math.round((style.lineHeight + style.padding.vertical * 2) * style.buttonProportion * (2 / 3))
				}
			};
			metrics.top -= (Math.ceil(Textbox.dialogue.first().minorResponses / style.responsesPerRow) * metrics.response.major.height + Math.ceil((Textbox.dialogue.first().responses.length - Textbox.dialogue.first().minorResponses) / style.responsesPerRow) * metrics.response.minor.height) * Textbox.slide;
		}
		metrics.inner.top = metrics.top + style.padding.vertical;
		return metrics;
	},
	initialise : function () {
		_method(Textbox.styles);
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
	say : function (text, progress, trigger, pause, after, delayPreparation) {
		/*
			text : The text to display,
				The text is a normal JavaScript string, optionally containing certain command tags:
				<TAG-NAME-HERE: TAG-VALUE-HERE> makes all text after that tag have that value
				<TAG-NAME-HERE:> makes all text after that tag have the value of the previous tag (tags stack)
				<TAG-NAME-HERE::> makes all text after that tag have the default value for that tag

				<colour: COLOUR-NAME-HERE> will make all text after that tag coloured
				<size: SIZE-IN-PIXELS-HERE> will make all text after that tag a different size
				<weight: bold> will make all text after that tag bold
				<style: italic> will make all text after that tag italic
			progress : How long to wait after displaying all the text before continuing ("manual" will require input from the user),
			trigger : A function to execute before continuing,
			pause : A condition to wait upon before finishing,
			after : A function to execute after pausing
		*/
		var styling = {};
		forevery(Textbox.commands, function (settings, command) {
			styling[command] = {};
		});
		if (text !== null) {
			text = "" + text;
			console.log(text);
			var regex, exclusive, position, value = null, previousValue, valueStack = [];
			forevery(Textbox.commands, function (settings, command) {
				regex = new RegExp("<" + command + ": ?(.*?)>", "i");
				exclusive = text;
				forevery(Textbox.commands, function (__, exclude) {
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
			style : Textbox.style,
			styling : styling,
			responses : [],
			progress : (arguments.length > 1 && progress !== null ? progress : "manual"),
			trigger : trigger,
			pause : pause,
			after : after
		};
		Textbox.active = true;
		Textbox.dialogue.push(message);
		if (Textbox.dialogue.length === 1 && !delayPreparation)
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
		return Textbox.say(text, until);
	},
	effect : function (trigger, pause, after) {
		return Textbox.say(null, Textbox.standardInterval, trigger, pause, after);
	},
	ask : function (query, responses, callback, minors, defaultResponse, hotkeys, name, hover, showTextImmediately) {
		Textbox.style = Textbox.style.replace(/ \(question\)$/, "") + " (question)";
		var latest = Textbox.messageWithId(Textbox.say(query, null, null, null, null, true));
		Textbox.style = Textbox.style.replace(/ \(question\)$/, "");
		responses = wrapArray(responses);
		if (arguments.length >= 4 && minors !== null && typeof minors !== "undefined")
			latest.responses = responses.concat(wrapArray(minors));
		else
			latest.responses = responses;
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
	newStyleContext : function (style) {
		var styleContext = {};
		forevery(Textbox.commands, function (settings, command) {
			styleContext[command] = (typeof settings.default !== "function" ? settings.default : settings.default(style));
		});
		return styleContext;
	},
	updateStyleContext : function (styleContext, styling, position, style) {
		forevery(Textbox.commands, function (__, command) {
			if (styling[command].hasOwnProperty(position)) {
				styleContext[command] = styling[command][position];
				if (styleContext[command] === "default")
					styleContext[command] = (typeof Textbox.commands[command] !== "function" ? Textbox.commands[command] : Textbox.commands[command](style));
			}
		});
	},
	wrap : function (text, styling) {
		var context = Textbox.canvas.context, style = Textbox.styles._(Textbox.style), metrics = Textbox.metrics(style), styleContext = Textbox.newStyleContext(style);
		for (var i = 0, width = 0, character, breakpoint = null, softBreakpoint = null; i < text.length; ++ i) {
			character = text[i];
			if (character === "\n") {
				breakpoint = softBreakpoint = null;
				width = 0;
				continue;
			}
			if (/\s/.test(character))
				breakpoint = i;
			Textbox.updateStyleContext(styleContext, styling, i, style);
			context.font = Font.loadFromStyle(styleContext);
			width += context.measureText(text[i]).width;
			if (width > metrics.inner.width) {
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
			} else if (width + context.measureText("-").width <= metrics.inner.width) {
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
			forevery(Textbox.dialogue.first().styling, function (details) {
				forevery(details, function (__, position) {
					partitionPositions.push(parseInt(position));
				});
			});
			partitionPositions.sort(function (a, b) { return a - b; });
			var style = Textbox.currentStyle(), styleContext = Textbox.newStyleContext(), lineHeights = [];
			foreach(lines, function (line, lineNumber) {
				partitions = Textbox.splitAtPositions(line, partitionPositions, characters);
				var maximumPartitionHeight = 0;
				foreach(partitions, function (part) {
					Textbox.measurement.innerHTML = "";
					Textbox.updateStyleContext(styleContext, Textbox.dialogue.first().styling, characters);
					Textbox.measurement.font = Font.loadFromStyle(styleContext);
					Textbox.measurement.appendChild(document.createTextNode(part));
					maximumPartitionHeight = Math.max(maximumPartitionHeight, Textbox.measurement.getBoundingClientRect().height);
					characters += part.length;
				});
				lineHeights.push(maximumPartitionHeight * (lineNumber > 0 ? 1 + style.lineSpacing : 1));
			});
			return lineHeights;
		}
		return [];
	},
	currentlyVisibleLines : function (descending) {
		if (Textbox.dialogue.notEmpty() && Textbox.dialogue.first().text !== null) {
			var metrics = Textbox.metrics(), style = Textbox.currentStyle(), lineHeights = Textbox.heightsOfLines(), visibleLines = 0, cumulativeHeight = lineHeights[Math.ceil(Textbox.lowestVisibleLine)] * (Textbox.lowestVisibleLine - Math.floor(Textbox.lowestVisibleLine)), totalHeight = sum(lineHeights, Textbox.lowestVisibleLine + 1);
			if (cumulativeHeight <= metrics.height - style.padding.vertical * 2) {
				visibleLines += Textbox.lowestVisibleLine - Math.floor(Textbox.lowestVisibleLine);
				for (var i = Math.floor(Textbox.lowestVisibleLine); (descending ? i < lineHeights.length : i >= 0); i += (descending ? 1 : -1)) {
					if ((cumulativeHeight += lineHeights[i]) <= metrics.height - style.padding.vertical * 2)
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
				if (Textbox.dialogue.first().responses.notEmpty()) {
					// Select default response
					Textbox.selectResponse(Textbox.dialogue.first().defaultResponse !== null ? Textbox.dialogue.first().defaultResponse : 0);
				}
				if (Textbox.dialogue.first().showTextImmediately)
					Textbox.character = Textbox.dialogue.first().text.length - 1;
				Textbox.lowestVisibleLine = 0;
				Textbox.lowestVisibleLine = Math.max(0, Textbox.currentlyVisibleLines(true).visibleLines - 1);
			}
		}
	},
	responsesOnRow : function (y) {
		if (arguments.length < 1)
			y = Textbox.responsePosition.y;
		var style = Textbox.currentStyle(), majorResponses = Textbox.dialogue.first().minorResponses, minorResponses = Textbox.dialogue.first().responses.length - Textbox.dialogue.first().minorResponses, majorRows = Math.ceil(majorResponses / style.responsesPerRow);
		return y < majorRows ? (majorResponses % style.responsesPerRow !== 0 && y === Math.floor(majorResponses / style.responsesPerRow) ? majorResponses % style.responsesPerRow : style.responsesPerRow) : (minorResponses % style.responsesPerRow !== 0 && y - majorRows === Math.floor(minorResponses / style.responsesPerRow) ? minorResponses % style.responsesPerRow : style.responsesPerRow);
	},
	selectResponse : function (response) {
		Textbox.response = response;
		var style = Textbox.currentStyle(), majorResponses = Textbox.dialogue.first().minorResponses;
		Textbox.responsePosition.y = (response < majorResponses ? Math.floor(response / style.responsesPerRow) : Math.ceil(majorResponses / style.responsesPerRow) + Math.floor((response - majorResponses) / style.responsesPerRow));
		Textbox.responsePosition.x = (response < majorResponses ? (response - Textbox.responsePosition.y * style.responsesPerRow + 0.5) : (response - majorResponses - (Textbox.responsePosition.y - Math.ceil(majorResponses / style.responsesPerRow)) * style.responsesPerRow + 0.5)) / Textbox.responsesOnRow();
	},
	selectAdjacent : function (direction) {
		if (Textbox.dialogue.length && Textbox.dialogue.first().responses.length) {
			if (Textbox.response === null)
				Textbox.response = 0;
			else {
				var style = Textbox.currentStyle(), majorResponses = Textbox.dialogue.first().minorResponses, minorResponses = Textbox.dialogue.first().responses.length - Textbox.dialogue.first().minorResponses, majorRows = Math.ceil(majorResponses / style.responsesPerRow), minorRows = Math.ceil(minorResponses / style.responsesPerRow);
				switch (direction) {
					case Directions.up:
						-- Textbox.responsePosition.y;
						break;
					case Directions.down:
						++ Textbox.responsePosition.y;
						break;
					break;
				}
				Textbox.responsePosition.y = Math.mod(Textbox.responsePosition.y, majorRows + minorRows);
				var responsesOnRow = Textbox.responsesOnRow();
				switch (direction) {
					case Directions.right:
						Textbox.responsePosition.x += 1 / responsesOnRow;
						break;
					case Directions.left:
						Textbox.responsePosition.x -= 1 / responsesOnRow;
					break;
				}
				Textbox.responsePosition.x = Math.mod(Textbox.responsePosition.x, 1);
				Textbox.response = Math.min(majorResponses, Textbox.responsePosition.y * style.responsesPerRow) + Math.round(roundTo(Textbox.responsePosition.x - 1 / responsesOnRow / 2, 1 / responsesOnRow) * responsesOnRow);
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
			var nullMessage = (Textbox.dialogue.first().text === null);
			if (Textbox.slide === 1 && !Textbox.pausing && !nullMessage) {
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
			if ((nullMessage || Textbox.displayed.length === Textbox.dialogue.first().text.length || Textbox.dialogue.first().text.split("\n").length - 1 === Textbox.lowestVisibleLine) && Textbox.finished === null) {
				Textbox.finished = Time.now();
			}
			if (((nullMessage && Time.now() >= Textbox.finished) || (Textbox.dialogue.first().progress !== "manual" && typeof Textbox.dialogue.first().progress === "number" && Time.now() >= Textbox.finished + Textbox.dialogue.first().progress)) && Textbox.finished !== null) {
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
			Textbox.slide = 0;
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
		var context = Textbox.canvas.context;
		// Clear the canvas
		context.clearRect(0, 0, Textbox.canvas.width, Textbox.canvas.height);
		if (Textbox.slide > 0) {
			// Draw the textbox
			var style = Textbox.currentStyle(), metrics = Textbox.metrics();
			context.fillStyle = "hsla(0, 0%, 0%, 0.8)";
			context.fillRect(metrics.left, metrics.top, metrics.width, metrics.height);
			if (Settings._("debug mode")) {
				context.fillStyle = "hsla(0, 0%, 100%, 0.2)";
				context.fillRect(metrics.inner.left, metrics.inner.top, metrics.inner.width, metrics.inner.height);
			}
			// Draw the text
			if (Textbox.dialogue.notEmpty() && Textbox.dialogue.first().text !== null) {
				var dialogue = Textbox.dialogue.first(), responses = dialogue.responses.length, majorResponses = dialogue.minorResponses, minorResponses = responses - dialogue.minorResponses;
				// Formatting
				context.textAlign = "left";
				context.textBaseline = "alphabetic";
				// Draw the actual characters
				var lines = Textbox.displayed.split("\n"), partitionPositions = [], partitions, characters = 0;
				forevery(Textbox.dialogue.first().styling, function (details) {
					forevery(details, function (__, position) {
						partitionPositions.push(parseInt(position));
					});
				});
				partitionPositions.sort(function (a, b) { return a - b; });
				var position = {
					x : 0
				}, styleContext = Textbox.newStyleContext(), lineHeights = Textbox.heightsOfLines(), currentLineStatistics = Textbox.currentlyVisibleLines();
				lines = Textbox.displayed.split("\n");
				foreach(lines, function (line, lineNumber) {
					partitions = Textbox.splitAtPositions(line, partitionPositions, characters);
					foreach(partitions, function (part) {
						var partitionWidth, verticalPosition = metrics.top + metrics.height - (style.padding.vertical + currentLineStatistics.totalHeight + (currentLineStatistics.totalHeight < metrics.inner.height ? metrics.inner.height - currentLineStatistics.cumulativeHeight : 0)) + sum(lineHeights, lineNumber + 1);
						Textbox.updateStyleContext(styleContext, Textbox.dialogue.first().styling, characters);
						context.font = Font.loadFromStyle(styleContext);
						partitionWidth = context.measureText(part).width;
						context.fillStyle = styleContext.colour;
						context.fillText(part, style.margin.horizontal + style.padding.horizontal + position.x, verticalPosition);
						position.x += partitionWidth;
						characters += part.length;
					});
					position.x = 0;
					characters += 1; // The newline character, which has been removed.
				});
				context.clearRect(0, 0, Textbox.canvas.width, metrics.top);
				context.clearRect(0, metrics.top + metrics.height, Textbox.canvas.width, Textbox.canvas.height - metrics.top - metrics.height);
				if (Textbox.displayed.length === dialogue.text.length) {
					context.textAlign = "center";
					context.textBaseline = "middle";
					var responseMetrics = {}, cursorIsOverAResponse = Game.cursor.inArea(metrics.left, metrics.top + metrics.height, metrics.width, Textbox.canvas.height - (metrics.top + metrics.height + style.margin.vertical));
					Game.canvas.element.classList.remove("hover");
					Textbox.hoverResponse = null;
					if (cursorIsOverAResponse)
						Game.canvas.element.classList.add("hover");
					else if (dialogue.hasOwnProperty("hover"))
						dialogue.hover(null, null);
					for (var response = 0, responsesOfKind, relativeResponse, selected, hovered, isMajor; response < responses; ++ response) {
						isMajor = response < majorResponses;
						responsesOfKind = isMajor ? majorResponses : minorResponses;
						relativeResponse = response - (isMajor ? 0 : majorResponses);
						responseMetrics.width = metrics.width / (responsesOfKind % style.responsesPerRow !== 0 && relativeResponse >= responsesOfKind - (responsesOfKind % style.responsesPerRow) ? responsesOfKind % style.responsesPerRow : style.responsesPerRow);
						responseMetrics.x = metrics.left + (relativeResponse % style.responsesPerRow) * responseMetrics.width;
						responseMetrics.y = metrics.top + metrics.height + (isMajor ? Math.floor(relativeResponse / style.responsesPerRow) * metrics.response.major.height : Math.ceil(majorResponses / style.responsesPerRow) * metrics.response.major.height + Math.floor(relativeResponse / style.responsesPerRow) * metrics.response.minor.height)
						responseMetrics.height = (isMajor ? metrics.response.major : metrics.response.minor).height;
						selected = (hovered = Game.cursor.inArea(responseMetrics.x, responseMetrics.y, responseMetrics.width, responseMetrics.height)) || (Game.control.current === Game.control.schemes.keyboard && Textbox.response === response && !cursorIsOverAResponse);
						context.fillStyle = (selected ? "hsla(0, 0%, 100%, 0.8)" : "hsla(0, 0%, 0%, 0.6)");
						context.fillRect(responseMetrics.x, responseMetrics.y, responseMetrics.width, responseMetrics.height);
						context.font = Font.load((isMajor ? metrics.response.major : metrics.response.minor).height * 0.8);
						context.fillStyle = (selected ? "black" : "white");
						context.fillText(dialogue.responses[response], responseMetrics.x + responseMetrics.width / 2, responseMetrics.y + responseMetrics.height / 2);
						if (selected) {
							if (hovered)
								Textbox.hoverResponse = response;
							if (dialogue.hasOwnProperty("hover"))
								dialogue.hover(response, isMajor);
						}
					}
					if (Settings._("debug mode")) {
						context.fillStyle = "hsla(0, 100%, 50%, 0.8)";
						var majorResponses = dialogue.minorResponses;
						context.fillCircle(metrics.left + Textbox.responsePosition.x * metrics.width, metrics.top + metrics.height + (Textbox.response < majorResponses ? Textbox.responsePosition.y + 0.5 : Math.ceil(majorResponses / style.responsesPerRow)) * metrics.response.major.height + (Textbox.response < majorResponses ? 0 : Textbox.responsePosition.y - Math.ceil(majorResponses / style.responsesPerRow) + 0.5) * metrics.response.minor.height, 3);
					}
				} else if (responses > 0) {
					context.fillStyle = "hsla(0, 0%, 0%, 0.6)";
					context.fillRect(0, metrics.top + metrics.height, Textbox.canvas.width, Textbox.canvas.height - metrics.top - metrics.height);
				}
			}
		}
	}
};
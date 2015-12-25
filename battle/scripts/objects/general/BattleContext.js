function BattleContext (client) {
	if (arguments.length < 1)
		client = false;
	var battleContext, visual = (client ? {
		initialise : function (self) {
			self.sketching = [];
			for (var i = 0; i < 4; ++ i) {
				self.sketching[i] = document.createElement("canvas");
				self.sketching[i].width = Settings._("screen dimensions => width");
				self.sketching[i].height = Settings._("screen dimensions => height");
				self.sketching[i].getContext("2d").imageSmoothingEnabled = false;
			}
		},
		update : function () {
			if (battleContext.active) {
				if (battleContext.state.kind === "opening") {
					battleContext.state.transition += 1 / (Time.framerate * Settings._("segue transition duration"));
					battleContext.state.transition = Math.clamp(0, battleContext.state.transition, 1);
					if (battleContext.state.transition === 1)
						battleContext.begin();
				}
				if (Settings._("visual weather effects") || display.flags.weather)
					Weather.particles.update();
			}
		},
		drawing : {
			canvas : {
				width : Settings._("screen dimensions => width") * Game.zoom,
				height : Settings._("screen dimensions => height") * Game.zoom,
				selector : "#game-battle",
				className : "centre",
				focusable : true,
				smoothing : false
			},
			draw : function (_canvas) {
				var originalCanvas = _canvas, originalContext = originalCanvas.getContext("2d"), drawAfterwards = [];
				var canvas = battleContext.sketching[0], context = canvas.getContext("2d"), display = Display.state.current, now = performance.now();
				var shadowCanvas = battleContext.sketching[1], shadowContext = shadowCanvas.getContext("2d"), shadowOpacity = Lighting.shadows.opacity();
				var pixelRatio = window.devicePixelRatio;
				var originalCanvasWidth = originalCanvas.width / pixelRatio, originalCanvasHeight = originalCanvas.height / pixelRatio, canvasWidth = canvas.width, canvasHeight = canvas.height;
				shadowContext.textAlign = "center";
				shadowContext.textBaseline = "bottom";
				for (var i = 0; i < battleContext.sketching.length; ++ i)
					battleContext.sketching[i].getContext("2d").clearRectHD(0, 0, canvasWidth, canvasHeight);
				originalContext.fillStyle = context.fillStyle = "black";
				originalContext.fillRectHD(0, 0, originalCanvasWidth, originalCanvasHeight);
				if (battleContext.state.kind !== "inactive") {
					if (battleContext.state.kind === "loading") {
						originalContext.fillStyle = "hsl(0, 0%, 20%)";
						originalContext.fillRectHD(40 * Game.zoom, originalCanvasHeight / 2 - 10 * Game.zoom, originalCanvasWidth - 80 * Game.zoom, 20 * Game.zoom);
						originalContext.fillStyle = "hsl(0, 0%, 90%)";
						originalContext.fillRectHD(40 * Game.zoom, originalCanvasHeight / 2 - 10 * Game.zoom, (originalCanvasWidth - 80 * Game.zoom) * battleContext.state.progress, 20 * Game.zoom);
						originalContext.textAlign = "center";
						originalContext.textBaseline = "middle";
						originalContext.font = Font.load(12 * Game.zoom);
						originalContext.strokeStyle = "hsl(0, 0%, 90%)";
						originalContext.lineWidth = 5;
						originalContext.strokeTextHD((battleContext.state.progress * 100).toFixed(0) + "%", originalCanvasWidth / 2, originalCanvasHeight / 2);
						originalContext.fillStyle = "black";
						originalContext.fillTextHD((battleContext.state.progress * 100).toFixed(0) + "%", originalCanvasWidth / 2, originalCanvasHeight / 2);
						if (battleContext.state.failed.notEmpty()) {
							originalContext.textBaseline = "top";
							originalContext.fillStyle = "hsl(0, 0%, 90%)";
							originalContext.fillTextHD("Failed to load " + battleContext.state.failed.length + " file" + (battleContext.state.failed.length !== 1 ? "s" : "") + ":", originalCanvasWidth / 2, originalCanvasHeight / 2 + (20 + 6) * Game.zoom);
							originalContext.fillStyle = "hsl(0, 0%, 50%)";
							foreach(battleContext.state.failed, function (failed, i) {
								originalContext.fillTextHD(failed, originalCanvasWidth / 2, originalCanvasHeight / 2 + (20 + 6 + 16 * (i + 1)) * Game.zoom);
							});
						}
					} else if (battleContext.state.kind === "evolution") {
						var strips = 8, pan = (now / 500 % 1), distortion = 4;
						for (var i = - distortion * 4, j; i < (strips + distortion * 4 + 1); ++ i) {
							j = i - pan;
							context.fillStyle = "hsl(" + Math.min(50, ((j / (strips)) * 50)) + ", 100%, " + (35 + (j / (strips)) * (60 - 35)) + "%)";
							context.beginPath();
							context.moveTo(0, canvas.height);
							context.lineTo(0, Math.round((canvas.height / strips) * j));
							context.quadraticCurveTo(canvas.width / 2, Math.round((canvas.height / strips) * j) - (j - strips / 2) * 10 * distortion, canvas.width, Math.round((canvas.height / strips) * j));
							context.lineTo(canvas.width, canvas.height);
							context.fill();
						}
						context.textAlign = "center";
						context.textBaseline = "middle";
						if (battleContext.state.stage === "before" || battleContext.state.stage === "preparation" || battleContext.state.stage === "stopped")
							Sprite.draw(canvas, battleContext.state.evolving.paths.sprite("front", true), canvas.width / 2, canvas.height / 2, true, null, null, now);
						if (battleContext.state.stage === "finishing" || battleContext.state.stage === "after")
							Sprite.draw(canvas, battleContext.state.into.paths.sprite("front", true), canvas.width / 2, canvas.height / 2, true, null, null, now);
						if (battleContext.state.stage === "preparation")
							battleContext.state.transition += 0.05;
						if (battleContext.state.stage === "evolving")
							battleContext.state.transition += 0.0025;
						if (battleContext.state.stage === "finishing")
							battleContext.state.transition -= 0.05;
						if (battleContext.state.stage === "preparation" && battleContext.state.transition >= 2) {
							battleContext.state.stage = "evolving";
							battleContext.state.transition = 0;
						}
						if (battleContext.state.stage === "evolving" && battleContext.state.transition >= 1) {
							if (!battleContext.state.prevented) {
								battleContext.state.stage = "finishing";
								battleContext.state.transition = 4;
							} else {
								battleContext.continueEvolutions(true);
							}
						}
						if (battleContext.state.stage === "finishing" && battleContext.state.transition <= 0) {
							battleContext.state.stage = "after";
							if (battleContext.playerIsParticipating()) {
								battleContext.inputs.push({
									action : "evolve",
									prevent : false
								});
							}
							battleContext.state.evolving.evolve(battleContext.state.into._("species"));
							var effect = function () {
								battleContext.continueEvolutions(false);
							};
							if (!battleContext.process) Textbox.effect(effect);
							else effect();
						}
						var transformationRate = Math.PI * Math.pow(2, battleContext.state.transition * 7);
						if (battleContext.state.stage !== "after") {
							var scale = 1, fade = 0;
							if (battleContext.state.stage === "preparation")
								fade = battleContext.state.transition;
							if (battleContext.state.stage === "evolving") {
								fade = Math.sin(battleContext.state.transition * (transformationRate / 2) + Math.PI * 0.25) >= 0 ? 1 : 0;
								scale = 1 + Math.sin(battleContext.state.transition * transformationRate) * 0.5;
							}
							Sprite.draw(canvas, battleContext.state.evolving.paths.sprite("front", true), canvas.width / 2, canvas.height / 2, true, [{ type : "fill", colour : "white" }, { type : "opacity", value : fade }], new Matrix().scale(scale), now);
						}
						if (battleContext.state.stage !== "before" && battleContext.state.stage !== "preparation") {
							var scale = 1, fade = 0;
							if (battleContext.state.stage === "finishing")
								fade = battleContext.state.transition;
							if (battleContext.state.stage === "evolving") {
								fade = Math.sin(battleContext.state.transition * (transformationRate / 2) + Math.PI * 1.25) > 0 ? 1 : 0;
								scale = 1 + Math.sin(battleContext.state.transition * transformationRate) * 0.5;
							}
							Sprite.draw(canvas, battleContext.state.into.paths.sprite("front", true), canvas.width / 2, canvas.height / 2, true, [{ type : "fill", colour : "white" }, { type : "opacity", value : fade }], new Matrix().scale(scale), now);
						}
						if (battleContext.state.stage !== "before" && battleContext.state.stage !== "after" && battleContext.state.stage !== "stopped") {
							context.fillStyle = "black";
							var enclose = 1;
							if (battleContext.state.stage === "preparation" || battleContext.state.stage === "finishing")
								enclose = Math.clamp(0, battleContext.state.transition, 1);
							context.fillRect(0, 0, canvas.width, canvas.height / 6 * enclose);
							context.fillRect(0, canvas.height, canvas.width, - canvas.height / 6 * enclose);
						}
					} else {
						Sprite.draw(battleContext.sketching[2], Scenes._(battleContext.scene).paths.sprite(true), 0, 0);
						context.textAlign = "center";
						context.textBaseline = "bottom";
						context.lineWidth = 2;
						context.strokeStyle = "white";
						var shadowMatrix = new Matrix ([1, 0.1, -0.6, 0.4, 0, 0]), matrix = new Matrix(), position, transition, side, generalMatrix;
						var sortDisplay = battleContext.cache || (battleContext.cache = Display.states[Display.state.save(Display.state.current)]), poke;
						var all = [].concat(sortDisplay.allies, sortDisplay.opponents.reverse()).filter(onlyPokemon).sort(function (a, b) {
							return battleContext.drawing.position(Display.pokemonInState(b), now).z - battleContext.drawing.position(Display.pokemonInState(a), now).z;
						});
						// Pokémon
						foreach(all, function (_poke) {
							poke = Display.pokemonInState(_poke);
							side = (poke.battler.side === Battles.side.near ? "back" : "front");
							position = battleContext.drawing.position(poke, now);
							context.lineWidth = position.scale * 2;
							transition = (poke.fainted() ? 1 : poke.battler.display.transition);
							generalMatrix = matrix.scale(position.scale * transition).rotate(poke.battler.display.angle);
							context.globalAlpha = poke.battler.display.opacity;
							var path = poke.paths.sprite(side, true);
							var sprite = Sprite.load(path);
							if (sprite) {
								var ratio = position.height / (position.height + sprite.image.height);
								var heightRatio = Math.min(1, poke.battler.display.height / (1 - ratio));
								var positionRatio = Math.max(0, 1 - (1 - poke.battler.display.height) / ratio);
								if (poke.battler.display.height !== 1) {
									position = battleContext.drawing.position(poke, now, positionRatio);
								}
								// Shadow
								Sprite.draw(shadowCanvas, path, position.x, battleContext.drawing.positions[poke.battler.side === Battles.side.near ? "sideNear" : "sideFar"].y - position.z, true, [{ type : "fill", colour : "hsla(0, 0%, 0%, " + (1 - Math.min(1, position.height / (canvasHeight / Game.zoom / 2))) * poke.battler.display.opacity + ")" }, { type : "crop", heightRatio }], generalMatrix.multiply(shadowMatrix).scale(Math.pow(2, - position.height / (canvasHeight / Game.zoom / 4))), now, true);
								// Outline
								if (poke.battler.display.outlined) {
									for (var angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
										Sprite.draw(canvas, path, position.x + Math.cos(angle) * context.lineWidth, position.y - position.z + Math.sin(angle) * context.lineWidth, true, [{ type : "fill", colour : context.strokeStyle }, { type : "crop", heightRatio }], generalMatrix, now);
									}
								}
								// Pokémon
								var filters = [];
								if (poke._("shiny"))
									filters.push({ type : "filter", kind : "shiny", pokemon : poke });
								filters.push({ type : "crop", heightRatio });
								Sprite.draw(canvas, path, position.x, position.y - position.z, true, filters, generalMatrix, now);
								// Overlay
								if (poke.battler.display.overlay !== null)
									Sprite.draw(canvas, path, position.x, position.y - position.z, true, [{ type : "fill", colour : poke.battler.display.overlay }, { type : "crop", heightRatio }], generalMatrix, now);
								// Lighting
								if (Scenes._(battleContext.scene).hasOwnProperty("lighting"))
									Sprite.draw(canvas, path, position.x, position.y - position.z, true, [{ type : "fill", colour : Scenes._(battleContext.scene).lighting }, { type : "crop", heightRatio }], generalMatrix, now);
								// Glow / Fade
								if (transition > 0 && transition < 1)
									Sprite.draw(canvas, path, position.x, position.y - position.z, true, [{ type : "fill", colour : "white" }, { type : "opacity", value : Math.pow(1 - transition, 0.4) }, { type : "crop", heightRatio }], generalMatrix, now);
							}
							context.globalAlpha = 1;
						});
						// Trainers
						foreach(battleContext.allTrainers(), function (character) {
							if (!character.isWild() && character.display.visible) {
								position = battleContext.drawing.position(character, now);
								side = (battleContext.alliedTrainers.contains(character) ? "back" : null);
								// Shadow
								Sprite.draw(shadowCanvas, character.paths.sprite(side, true), position.x, position.y - position.z + character.display.position.y, true, { type : "fill", colour : "black" }, shadowMatrix.scale(position.scale).scale(Math.pow(2, -character.display.position.y / 100)), now);
								// Trainer
								Sprite.draw(canvas, character.paths.sprite(side, true), position.x, position.y - position.z, true, null, matrix.scale(position.scale), now);
								// Lighting
								if (Scenes._(battleContext.scene).hasOwnProperty("lighting"))
									Sprite.draw(canvas, character.paths.sprite(side, true), position.x, position.y - position.z, true, { type : "fill", colour : Scenes._(battleContext.scene).lighting }, matrix.scale(position.scale), now);
							}
						});
						if (sortDisplay.allies.length === 0 || sortDisplay.opponents.length === 0) {
							foreach(battleContext.allTrainers(), function (character) {
								if (!character.isWild() && character.display.visible) {
									drawAfterwards.push(function (canvas) {
										battleContext.drawing.partyBar(canvas, character, battleContext.alliedTrainers.contains(character), battleContext.alliedTrainers.contains(character) ? 120 : 30);
									});
								}
							});
						}
						// Weather effects
						if (Settings._("visual weather effects") || display.flags.weather)
							Weather.draw(context);
						// Status bars
						foreach(display.opponents, function (poke, place) {
							if (poke !== NoPokemon)
								drawAfterwards.push(function (canvas) {
									battleContext.drawing.bar(canvas, poke, false, 30 + 34 * place);
								});
						});
						foreach(display.allies, function (poke, place) {
							if (poke !== NoPokemon)
								drawAfterwards.push(function (canvas) {
									battleContext.drawing.bar(canvas, poke, true, 134 + 42 * place, true);
								});
						});
						if (battleContext.state.kind === "opening") {
							drawAfterwards.push(function (canvas) {
								context.fillStyle = "hsla(0, 0%, 0%, " + (1 - Math.clamp(0, battleContext.state.transition, 1)).toFixed(3) + ")";
								context.fillRectHD(0, 0, canvasWidth, canvasHeight);
							});
						}
					}
				} else {
					return;
				}
				var smallContext = battleContext.sketching[3].getContext("2d");
				smallContext.save();
				smallContext.translate(canvasWidth / 2, canvasHeight / 2);
				var transformation = new Matrix().rotate(View.angle);
				transformation.applyToContext(smallContext);
				var drawSketchingCanvas = function (i) {
					smallContext.drawImage(battleContext.sketching[i], - (View.position.x + canvasWidth * (View.zoom - 1) / 2) - canvasWidth / 2, - (View.position.y + canvasHeight * (View.zoom - 1) / 2) - canvasHeight / 2, canvasWidth * View.zoom, canvasHeight * View.zoom);
				};
				drawSketchingCanvas(2);
				smallContext.globalAlpha = shadowOpacity;
				drawSketchingCanvas(1);
				smallContext.globalAlpha = 1;
				drawSketchingCanvas(0);
				smallContext.restore();
				originalContext.copyImageHD(battleContext.sketching[3], false, true, (originalCanvasWidth - canvasWidth * Game.zoom) / 2, (originalCanvasHeight - canvasHeight * Game.zoom) / 2, canvasWidth * Game.zoom, canvasHeight * Game.zoom);
				foreach(drawAfterwards, function (drawing) {
					drawing(originalCanvas);
				});
				if (battleContext.timer !== null) {
					var timeLeft = battleContext.timer.end - now, pulsate = 2 * Math.sin(Math.max(0, 10 * 1000 - timeLeft) / 80) * Game.zoom, radius = { outer : (15 + pulsate) * Game.zoom, inner : 10 * Game.zoom }, padding = 8 * Game.zoom, centre = { x : originalCanvasWidth - padding - radius.outer + pulsate, y : padding + radius.outer - pulsate }, startAngle = Math.PI / 2, endAngle = startAngle - (now - battleContext.timer.start) / (battleContext.timer.end - battleContext.timer.start) * 2 * Math.PI;
					originalContext.fillStyle = "hsla(0, 0%, 100%, 0.75)";
					originalContext.fillCircleHD(centre.x, centre.y, radius.outer);
					originalContext.fillStyle = "hsla(0, 50%, 50%, 0.75)";
					originalContext.beginPath();
					originalContext.arcHD(centre.x, centre.y, radius.inner, 2 * Math.PI - startAngle, 2 * Math.PI - endAngle, false);
					originalContext.arcHD(centre.x, centre.y, radius.outer, 2 * Math.PI - endAngle, 2 * Math.PI - startAngle, true);
					originalContext.fill();
					originalContext.fillStyle = "hsla(0, 0%, 0%, 1)";
					originalContext.textAlign = "center";
					originalContext.textBaseline = "middle";
					originalContext.font = Font.load(16 * Game.zoom, "bold");
					originalContext.fillTextHD(Math.ceil(Math.max(0, timeLeft / 1000)), centre.x, centre.y);
				}
			}
		}
	} : {});
	battleContext = FunctionObject.new({
		process : !client,
		identifier : null,
		active : false,
		finished : true,
		state : {
			kind : "inactive"
		},
		delegates : BattleContext.defaultDelegates,
		style : null,
		flags : [],
		allies : [],
		alliedTrainers : [],
		opponents : [],
		opposingTrainers : [],
		participants : [],
		levelUppers : [],
		weather : {
			current : "clear skies",
			lasting : null
		},
		turns : 0,
		timer : null,
		callback : null,
		encounterTile : null,
		selection : 0,
		delayForInput : 0, // Delay asking the player what they'd like to do until a potentially breaking change has been made (such as learning a new move, which needs to wait, so that the new move will show up in the Pokémon's move list)
		endingFlags : null,
		queue : [],
		actions : [],
		random : new srandom(),
		inputs : [],
		communication : [],
		evolving : [],
		scene : null,
		rules : [],
		hazards : {
			near : [],
			far : []
		},
		effects : {
			near : [],
			far : [],
			specific : []
		},
		display : {
			weather : false
		},
		cache : null,
		drawing : {
			positions : {
				sideNear : {
					x : 90,
					y : 220,
					z : 0
				},
				sideFar : {
					x : 230,
					y : 220,
					z : 115
				}
			},
			transition : function (object, property, to, duration) {
				var from = object[property];
				return function () {
					if (duration !== 0) {
						var clamp = from < to ? Math.min : Math.max;
						object[property] = clamp(object[property] + (to - from) / duration, to);
					} else {
						object[property] = to;
					}
					return object[property] === to;
				};
			},
			complexShape : function (canvas, shapes, right, y, shift) {
				var context = canvas.getContext("2d"), current = { x : 0, y : 0 }, width = 0;
				foreach(shapes, function (shape) {
					if (shape.hasOwnProperty("points")) {
						foreach(shape.points, function (point) {
							if (point.x > width)
								width = point.x;
						});
					}
				});
				foreach(shapes, function (shape) {
					context.fillStyle = shape.colour;
					if (shape.hasOwnProperty("points")) {
						context.beginPath();
						foreach(shape.points, function (point) {
							if (point.hasOwnProperty("x"))
								current.x = point.x;
							if (point.hasOwnProperty("y"))
								current.y = point.y;
							context.lineToHD(canvas.width / window.devicePixelRatio * (right ? 1 : 0) + ((current.x - (width * (1 - shift))) * Game.zoom) * (right ? -1 : 1), (y + current.y) * Game.zoom);
						});
						context.fill();
					}
					if (shape.hasOwnProperty("text")) {
						context.font = shape.font;
						context.textAlign = shape.align.x;
						context.textBaseline = shape.align.y;
						context.fillTextHD(shape.text, canvas.width / window.devicePixelRatio * (right ? 1 : 0) + ((shape.position.x - (width * (1 - shift))) * Game.zoom) * (right ? -1 : 1), (y + shape.position.y) * Game.zoom);
					}
				});
			},
			partyBar : function (canvas, character, right, y) {
				var context = canvas.getContext("2d");
				var shapes = [
					{
						points : [{ x : 0, y : -8 }, { x : 102 }, { x : 118, y : 8 }, { x : 0 }],
						colour : "hsla(0, 0%, 0%, 0.6)"
					}
				];
				var transition = 1 - character.display.position.x / -200;
				battleContext.drawing.complexShape(canvas, shapes, right, y, transition);
				for (var i = 0, pos; i < character.party.pokemon.length; ++ i) {
					pos = (!right ? 0 : canvas.width / window.devicePixelRatio) + (12 + i * 16 - 118 * (1 - transition)) * Game.zoom * (!right ? 1 : -1);
					context.fillStyle = !character.party.pokemon[right ? character.party.pokemon.length - (i + 1) : i].fainted() ? "red" : "grey";
					context.fillCircleHD(pos, y * Game.zoom, 4 * Game.zoom);
					context.fillStyle = "white";
					context.fillCircleHD(pos, y * Game.zoom, 4 * Game.zoom, Math.PI);
					context.fillStyle = context.strokeStyle = "black";
					context.beginPath();
					context.moveToHD(pos - 4 * Game.zoom, y * Game.zoom);
					context.lineToHD(pos + 4 * Game.zoom, y * Game.zoom);
					context.lineWidth = 0.75;
					context.stroke();
					context.fillCircleHD(pos, y * Game.zoom, 1.75 * Game.zoom);
					context.fillStyle = "white";
					context.fillCircleHD(pos, y * Game.zoom, 1 * Game.zoom);
					if (character.party.pokemon[right ? character.party.pokemon.length - (i + 1) : i].fainted()) {
						context.fillStyle = "hsla(0, 0%, 0%, 0.3)";
						context.fillCircleHD(pos, y * Game.zoom, 4 * Game.zoom);
					}
				}
			},
			bar : function (canvas, poke, right, y, detailed) {
				var context = canvas.getContext("2d"), pixelWidth = 16, percentageHealth = poke.health / poke.maximumHealth(), percentageExperience = poke.experience / poke.experienceFromLevelToNextLevel();
				do {
					context.font = Font.load(pixelWidth);
					pixelWidth -= 1;
				} while (context.measureTextHD(poke.name()).width > 60);
				var shapes = [
					{
						points : [{ x : 0, y : -16 }, { x : 82 }, { x : 98, y : 0 }, { x : 162 }, { x : 146, y : 16 }, { x : 0 }],
						colour : "hsla(0, 0%, 0%, 0.6)"
					},
					{
						text :  poke.name(),
						position : { x : (78 + 20) / 2, y : (-16 + 6) / 2 },
						align : { x : "center" , y : "middle" },
						colour : "white",
						font : Font.load(pixelWidth * Game.zoom, null, "")
					},
					{
						points : [{ x : 0, y : 6 }, { x : 148 - 148 * (1 - percentageHealth) }, { x : 144 - 148 * (1 - percentageHealth), y : 10 }, { x : 0 }],
						colour : (percentageHealth > 0.5 ? "hsl(110, 100%, 40%)" : percentageHealth > 0.2 ? "hsl(40, 100%, 50%)" : "hsl(0, 100%, 50%)")
					},
					{
						text :  "Lv.",
						position : { x : 4, y : -16 },
						align : { x : (right ? "right" : "left") , y : "top" },
						colour : "white",
						font : Font.load(8 * Game.zoom)
					},
					{
						text :  poke.level,
						position : { x : 4, y : -8 },
						align : { x : (right ? "right" : "left") , y : "top" },
						colour : "white",
						font : Font.load(10 * Game.zoom)
					},
				];
				var gender = poke._("-> battler ~> transform => gender");
				if (gender !== "neuter")
					shapes = shapes.concat([
						{
							points : [{ x : 82, y : -16 }, { x : 106 }, { x : 122, y : 0 }, { x : 98 }],
							colour : (gender === "male" ? "hsl(195, 100%, 45%)" : "hsl(325, 100%, 80%)")
						},
						{
							text :  (gender === "male" ? "♂" : "♀"),
							position : { x : (82 + 122) / 2, y : (-16 + 0) / 2 },
							align : { x : "center", y : "middle" },
							colour : (gender === "male" ? "hsl(195, 100%, 5%)" : "hsl(325, 100%, 40%)"),
							font : Font.load(12 * Game.zoom)
						}
					]);
				if (right) {
					shapes = shapes.concat([
						{
							points : [{ x : 146, y : 16 }, {x  : 138, y : 24 }, { x : 90 }, { x : 82, y : 16 }],
							colour : "hsla(0, 0%, 0%, 0.6)"
						},
						{
							text :  Math.round(poke.health) + " / " + poke.maximumHealth(),
							position : { x : (138 + 90) / 2, y : 22 },
							align : { x : "center" , y : "bottom" },
							colour : "white",
							font : Font.load(8 * Game.zoom)
						}
					]);
					if (!battleContext.isCompetitiveBattle()) {
						shapes = shapes.concat([{
							points : [{ x : 0, y : 18 }, { x : 80 }, { x : 86, y : 24 }, { x : 0 }],
							colour : "hsla(0, 0%, 0%, 0.6)"
						}]);
						if (percentageExperience > 0) {
							shapes = shapes.concat([{
								points : [{ x : 0, y : 20 }, { x : 78 - 80 * (1 - percentageExperience) }, { x : 80 - 80 * (1 - percentageExperience), y : 22 }, { x : 0 }],
								colour : "hsl(190, 100%, 50%)"
							}]);
						}
					}
				}
				battleContext.drawing.complexShape(canvas, shapes, right, y, poke.battler.display.transition);
			},
			position : function (entity, time, positionRatio) {
				var position = {};
				if (arguments.length < 3) {
					positionRatio = 1;
				}
				if (entity instanceof pokemon) {
					var poke = entity, display = Display.state.current, attributes = poke.currentProperty("attributes"), floating = (attributes.hasOwnProperty("floating") ? attributes.floating.height + (attributes.floating.hasOwnProperty("deviation") && attributes.floating.hasOwnProperty("period") && poke.battler.display.position.y === 0 ? Math.sin(time * (2 * Math.PI) / (attributes.floating.period * Time.second)) * attributes.floating.deviation : 0) : 0);
					var ally = display.allies.contains(entity), place, count = battleContext.pokemonPerSide();
					if (ally) {
						place = display.allies.indexOf(poke);
						position.z = battleContext.drawing.positions.sideNear.z + poke.battler.display.position.z;
						position.scale = 2 / Math.pow(2, position.z / (battleContext.drawing.positions.sideFar.z - battleContext.drawing.positions.sideNear.z));
						position.x = battleContext.drawing.positions.sideNear.x + poke.battler.display.position.x * position.scale + place * 100 - (count - 1) * 40;
						position.height = (poke.battler.display.position.y + floating) * positionRatio;
						position.y = battleContext.drawing.positions.sideNear.y - position.height * position.scale;
					} else {
						place = display.opponents.indexOf(poke);
						position.z = battleContext.drawing.positions.sideFar.z - poke.battler.display.position.z;
						position.scale = 2 / Math.pow(2, position.z / (battleContext.drawing.positions.sideFar.z - battleContext.drawing.positions.sideNear.z));
						position.x = battleContext.drawing.positions.sideFar.x - poke.battler.display.position.x * position.scale - place * 80 + (count - 1) * 40;
						position.height = (poke.battler.display.position.y + floating) * positionRatio;
						position.y = battleContext.drawing.positions.sideFar.y - position.height * position.scale;
					}
				} else {
					var character = entity;
					position = battleContext.drawing.positions;
					if (battleContext.alliedTrainers.contains(character)) {
						position = {
							x : battleContext.drawing.positions.sideNear.x + character.display.position.x,
							y : battleContext.drawing.positions.sideNear.y - character.display.position.y,
							z : battleContext.drawing.positions.sideNear.z + character.display.position.z,
							height : character.display.position.y
						};
					} else {
						position = {
							x : battleContext.drawing.positions.sideFar.x - character.display.position.x,
							y : battleContext.drawing.positions.sideFar.y - character.display.position.y,
							z : battleContext.drawing.positions.sideFar.z - character.display.position.z,
							height : character.display.position.y
						};
					}
					position.scale = 1;
				}
				return position;
			}
		},
		all : function (excludeNoPokemon) {
			var all = [].concat(battleContext.allies, battleContext.opponents);
			if (excludeNoPokemon)
				all = all.filter(onlyPokemon);
			return all;
		},
		allTrainers : function () {
			return [].concat(battleContext.alliedTrainers, battleContext.opposingTrainers);
		},
		alliesTo : function (poke) {
			if (battleContext.allies.indexOf(poke) > -1)
				return battleContext.allies;
			if (battleContext.opponents.indexOf(poke) > -1)
				return battleContext.opponents;
			return [];
		},
		opponentsTo : function (poke) {
			if (battleContext.allies.indexOf(poke) > -1)
				return battleContext.opponents.filter(onlyPokemon);
			if (battleContext.opponents.indexOf(poke) > -1)
				return battleContext.allies.filter(onlyPokemon);
			return [];
		},
		notifyDelegates : function (message) {
			forevery(battleContext.delegates, function (delegate) {
				if (delegate.hasOwnProperty(message)) {
					delegate[message](battleContext);
				}
			});
		},
		load : function (alliedTrainers, opposingTrainers, settings) {
			battleContext.state = {
				kind : "loading",
				progress : 0,
				failed : []
			};
			var resources = [Scenes._(settings.scene).paths.sprite(true)], loaded = 0;
			// foreach([].concat(alliedTrainers, opposingTrainers), function (character) {
			// 	resources.push(character.paths.sprite(alliedTrainers.contains(character) ? "back" : null, true));
			// 	foreach(character.party.pokemon, function (poke) {
			// 		resources.push(poke.paths.sprite("front", true), poke.paths.sprite("back", true), poke.paths.cry(true));
			// 	});
			// });
			var timeout = 3 * Time.seconds, unloadedResources = resources.slice(0);
			var finish = function () {
				if (!battleContext.process) Textbox.stateUntil("", function () { return battleContext.state.kind !== "opening"; });
				battleContext.state = {
					kind : "opening",
					transition : 0
				};
			}, progress = function (resource) {
				unloadedResources.remove(unloadedResources.indexOf(resource));
				battleContext.state.progress = ++ loaded / resources.length;
				if (loaded === resources.length) {
					finish();
				}
			};
			foreach(resources, function (resource) {
				File.load(resource, function (resource) { return function () {
					progress(resource);
				}; }(resource), function (resource, message) {
					if (battleContext.state.kind === "loading") { // If the game lags a lot, file loading attempts may overshoot the timeout
						battleContext.state.failed.push(resource);
						if (Settings._("ignore missing files"))
							progress();
					}
					Debugger.error("There was an error loading one of the files", resource);
				});
			});
			setTimeout(function () {
				if (unloadedResources.notEmpty() && battleContext.state.kind === "loading") {
					foreach(unloadedResources, function (file) {
						battleContext.state.failed.pushIfNotAlreadyContained(file);
					});
					if (Settings._("ignore missing files"))
						finish();
				}
			}, timeout);
		},
		beginOnline : function (seed, alliedTrainers, opposingTrainers, settings, callback) {
			battleContext.random.seed = seed;
			settings.flags.pushIfNotAlreadyContained("competitive");
			battleContext.initiate(alliedTrainers, opposingTrainers, settings, callback);
		},
		beginWildBattle : function (alliedTrainers, pokes, settings, callback) {
			pokes = wrapArray(pokes);
			battleContext.initiate(alliedTrainers, trainer.newWildTrainer(pokes), settings, callback);
		},
		beginTrainerBattle : function (alliedTrainers, opposingTrainers, settings, callback) {
			battleContext.initiate(alliedTrainers, opposingTrainers, settings, callback);
		},
		initiate : function (alliedTrainers, opposingTrainers, settings, callback) {
			if (!battleContext.active) {
				if (!battleContext.process) Textbox.setStyle("battle");
				if (arguments.length < 3 || typeof settings === "undefined" || settings === null)
					settings = {};
				if (!settings.hasOwnProperty("scene"))
					settings.scene = "Field Clearing";
				if (!settings.hasOwnProperty("style"))
					settings.style = "normal";
				if (!settings.hasOwnProperty("weather"))
					settings.weather = "clear skies";
				battleContext.finished = false;
				if (arguments.length >= 4)
					battleContext.callback = callback;
				else
					battleContext.callback = null;
				battleContext.rules = settings.rules;
				battleContext.scene = settings.scene;
				battleContext.style = settings.style;
				battleContext.flags = settings.flags;
				battleContext.encounterTile = settings.tile;
				battleContext.changeWeather(settings.weather, null);
				alliedTrainers = wrapArray(alliedTrainers);
				opposingTrainers = wrapArray(opposingTrainers);
				battleContext.alliedTrainers = alliedTrainers;
				battleContext.opposingTrainers = opposingTrainers;
				if (foreach(battleContext.alliedTrainers, function (participant) {
					participant.display.visible = true;
					participant.megaEvolution = false;
					if (!participant.hasHealthyEligiblePokemon(battleContext.style)) {
						battleContext.active = true;
						battleContext.finish();
						battleContext.end({
							"outcome" : "illegal battle"
						});
						return true;
					} else {
						for (var i = 0, newPoke; i < Math.min(battleContext.pokemonPerSide() / battleContext.alliedTrainers.length, participant.healthyEligiblePokemon().length); ++ i) {
							newPoke = participant.healthyEligiblePokemon()[i];
							battleContext.queue.push({
								poke : newPoke,
								doesNotRequirePokemonToBeBattling : true,
								priority : 1 - (1 / (battleContext.alliedTrainers.length + 3)) * (i + 1),
								action : function (which) {return function () {
									battleContext.enter(which, true, null, true);
								}; }(newPoke)
							});
						}
					}
				}))
					return;
				if (foreach(battleContext.opposingTrainers, function (participant) {
					participant.display.visible = true;
					participant.megaEvolution = false;
					if (!participant.hasHealthyEligiblePokemon(battleContext.style)) {
						battleContext.active = true;
						battleContext.finish();
						battleContext.end({
							"outcome" : "illegal battle"
						});
						return true;
					} else {
						for (var i = 0, newPoke; i < Math.min(battleContext.pokemonPerSide() / battleContext.opposingTrainers.length, participant.healthyEligiblePokemon().length); ++ i) {
							newPoke = participant.healthyEligiblePokemon()[i];
							if (newPoke.isWild())
								battleContext.enter(newPoke, true, null, true);
							else battleContext.queue.push({
								poke : newPoke,
								doesNotRequirePokemonToBeBattling : true,
								priority : (1 - (1 / (battleContext.opposingTrainers.length + 3)) * (i + 1)) / 10,
								action : function (which) {return function () {
									battleContext.enter(which, true, null, true);
								}; }(newPoke)});
						}
					}
				}))
					return;
				battleContext.active = true;
				if (!battleContext.process) {
					Display.state.load(Display.state.save());
					battleContext.load(alliedTrainers, opposingTrainers, settings);
				} else {
					battleContext.begin();
				}
			} else
				throw new Error("You've tried to start a battle when one is already in progress!");
		},
		begin : function () {
			battleContext.state = {
				kind : "running"
			};
			battleContext.notifyDelegates("battleIsBeginning");
			if (!battleContext.process) {
				Display.state.load(Display.state.save());
				var names = [], number = 0;
				if (battleContext.isWildBattle()) {
					var wildPokemon = battleContext.opposingTrainers.first().healthyEligiblePokemon();
					if (wildPokemon.length === 1)
						Textbox.state("A wild " + wildPokemon.first().name() + " appeared!");
					else {
						foreach(wildPokemon, function (poke) {
							names.push(poke.name());
							++ number;
						});
						Textbox.state("A " + (wildPokemon.length === 2 ? "pair of" : "group of " + number) + " wild Pokémon appeared: " + commaSeparatedList(names) + "!");
					}
				} else {
					foreach(battleContext.opposingTrainers, function (character) {
						character.display.visible = true;
						names.push(character.fullname());
						++ number;
					});
					if (names.length === 1)
						Textbox.state(names.first() + " is challenging " + battleContext.alliedTrainers.first().pronoun() + " to a battle!");
					if (names.length > 1)
						Textbox.state(commaSeparatedList(names) + " are challenging " + battleContext.alliedTrainers.first().pronoun() + " to a battle!");
				}
			}
			foreach(battleContext.allTrainers(), function (character) {
				character.battle = battleContext;
			});
			battleContext.race(battleContext.queue);
			battleContext.queue = [];
			battleContext.startTurn();
		},
		finish : function () {
			battleContext.finished = true;
		},
		end : function (flags, forcefully) {
			if (battleContext.active) {
				battleContext.active = false;
				if (flags) {
					battleContext.endingFlags = flags;
				}
				if (!battleContext.process && forcefully)
					Textbox.clear();
				if (!battleContext.process) Textbox.setStyle("standard");
				if (!battleContext.process)
					battleContext.draw();
				foreach(battleContext.allTrainers(), function (participant) {
					foreach(participant.party.pokemon, function (poke) {
						poke.mega = null;
						if (battleContext.participants.contains(poke) && battleContext.levelUppers.contains(poke)) {
							var mayEvolve = poke.attemptEvolution("level");
							if (mayEvolve) {
								battleContext.evolving.push({
									from : poke,
									into : new pokemon(mayEvolve)
								});
							}
						}
					});
					participant.resetDisplay(); // Reset the trainer's display
					foreach(participant.bag, function (item) {
						item.intentToUse = 0;
					});
					participant.megaEvolution = false;
					participant.mostRecentlyFaintedPokemon = null;
				});
				if (battleContext.playerIsParticipating()) {
					battleContext.handler = Keys.addHandler(function (key, pressed) {
						if (pressed && battleContext.state.kind === "evolution" && !["stopped", "finishing", "after"].contains(battleContext.state.stage) && Textbox.dialogue.empty()) {
							battleContext.inputs.push({
								action : "evolve",
								prevent : true
							});
							battleContext.continueEvolutions(true);
						}
					}, Settings._("keys => secondary"));
				}
				if (!battleContext.playerIsParticipating()) {
					battleContext.waitForActions("evolve", function () {
						foreach(battleContext.evolving, function (evolving) {
							var action = null;
							foreach(battleContext.communication, function (communication, j) {
								if (communication.action === "evolve" && communication.trainer === evolving.from.trainer.identification) {
									action = j;
									return true;
								}
							});
							if (action !== null) {
								action = battleContext.communication.remove(action);
								if (!action.prevent) {
									if (battleContext.process) evolving.from.evolve(evolving.into._("species"));
								} else if (!battleContext.process) {
									evolving.prevented = true;
								}
							} else return true;
						});
						if (battleContext.process) {
							battleContext.evolving = [];
							battleContext.complete();
						} else
							battleContext.continueEvolutions(false);
					});
				}
				if (!battleContext.process)
					battleContext.continueEvolutions(false);
			}
		},
		complete : function () {
			foreach(battleContext.all(true), function (poke) {
				if (poke.status === "badly poisoned")
					poke.status = "poisoned";
				poke.battler.reset();
			});
			battleContext.allies = [];
			battleContext.opponents = [];
			var stored = [];
			foreach(battleContext.allTrainers(), function (character) {
				character.battle = null;
				stored.push(character.store());
			});
			battleContext.alliedTrainers = [];
			battleContext.opposingTrainers = [];
			battleContext.participants = [];
			battleContext.levelUppers = [];
			battleContext.queue = [];
			battleContext.inputs = [];
			battleContext.rules = [];
			battleContext.escapeAttempts = 0;
			battleContext.turns = 0;
			battleContext.communication = [];
			if (battleContext.callback) {
				/*
				Possible values for the "outcome" flag:
					"termination" [forceful terminal of the battle by an outside event]
					"allied victory" [the allied side won the battle]
					"opposing victory" [the opposing side won the battle]
					"draw" [it was a complete draw]
					"escape" [the allies escaped from a wild battle]
					"illegal battle" [the trainers did not have Pokémon matching the battle requirements]
				*/
				battleContext.callback(battleContext.endingFlags, stored);
			}
			battleContext.notifyDelegates("battleIsEnding");
			battleContext.identifier = null;
		},
		continueEvolutions : function (preventCurrentEvolution) {
			if (preventCurrentEvolution) {
				battleContext.state = {
					kind : "evolution",
					stage : "stopped",
					transition: 0,
					evolving : battleContext.state.evolving,
					into : battleContext.state.into
				};
				Textbox.state("...what? " + battleContext.state.evolving.name() + " has stopped evolving!", function () {
					battleContext.continueEvolutions(false);
				});
			} else if (battleContext.evolving.notEmpty()) {
				var evolver = battleContext.evolving.shift();
				battleContext.state = {
					kind : "evolution",
					stage : !battleContext.process ? "before" : "preparation",
					transition: 0,
					evolving : evolver.from,
					into : evolver.into,
					prevented : evolver.prevented
				};
				if (!battleContext.process) Textbox.state("What? " + evolver.from.name() + " is evolving!", function () {
					battleContext.state.stage = "preparation";
				});
			} else {
				battleContext.flushInputs();
				if (battleContext.playerIsParticipating()) {
					Keys.removeHandler(battleContext.handler);
					delete battleContext.handler;
				}
				battleContext.state = {
					kind : "inactive"
				};
				battleContext.complete();
			}
		},
		input : function (primary, secondary, tertiary, character, selection) {
			var advance = true, reprompt = true;
			var inBattle = [], all = battleContext.all(true);
			if (arguments.length < 4) {
				character = Game.player;
				selection = battleContext.selection;
			}
			foreach(all, function (poke) {
				if (poke.trainer === character)
					inBattle.push(poke);
			});
			var names, positions, currentBattler = inBattle[selection];
			switch (primary) {
				case "Fight":
					var chosenMove = currentBattler.usableMoves()[secondary], chosenActualMove = Moves._(chosenMove.move);
					var who = null;
					if (typeof tertiary !== "undefined" && tertiary !== null) {
						who = tertiary;
					} else {
						if (![Move.targets.opposingSide, Move.targets.alliedSide, Move.targets.bothSides].contains(chosenActualMove.targets)) {
							var targets = [], targetNames = [], place, affected, partOfTarget, names, all = battleContext.all(true);
							foreach(all, function (poke) {
								place = battleContext.placeOfPokemon(poke);
								if (battleContext.pokemonInRangeOfMove(currentBattler, poke, chosenActualMove)) {
									affected = chosenActualMove.affects;
									partOfTarget = [];
									if (affected.contains(Move.target.directTarget)) {
										partOfTarget.push(place);
									}
									foreach(battleContext.alliesTo(currentBattler).filter(onlyPokemon), function (adjacent) {
										var distance = Math.floor(battleContext.distanceBetween(currentBattler, adjacent));
										if (((affected.contains(Move.target.self) && distance === 0) || (affected.contains(Move.target.adjacentAlly) && distance === 1) || ((affected.contains(Move.target.farAlly) && distance === 2))))
											partOfTarget.push(battleContext.placeOfPokemon(adjacent));
									});
									foreach(battleContext.opponentsTo(currentBattler).filter(onlyPokemon), function (adjacent) {
										var distance = Math.floor(battleContext.distanceBetween(currentBattler, adjacent));
										if (((affected.contains(Move.target.directOpponent) && distance === 0) || (affected.contains(Move.target.adjacentOpponent) && distance === 1) || ((affected.contains(Move.target.farOpponent) && distance === 2))))
											partOfTarget.push(battleContext.placeOfPokemon(adjacent));
									});
									names = [];
									foreach(partOfTarget, function (part) {
										names.push(battleContext.pokemonInPlace(part).name());
									});
									partOfTarget = partOfTarget.removeDuplicates();
									if (!foreach(targets, function (who) {
										if (who.affects.isSimilarTo(partOfTarget))
											return true;
									})) {
										targetNames.push(commaSeparatedList(names, true));
										targets.push({
											target : place,
											affects : partOfTarget
										});
									}
								}
							});
							if (battleContext.pokemonPerSide() > 1 || targets.length > 1) {
								targets.reverse();
								targetNames.reverse();
								var displayAll = [].concat(Display.state.current.allies, Display.state.current.opponents), hotkeys = {};
								hotkeys[Settings._("keys => secondary")] = "Cancel";
								Textbox.ask("Whom do you want " + currentBattler.name() + " to attack?", targetNames, function (response, i, major) {
									if (response !== "Cancel")
										battleContext.input("Fight", secondary, targets[i].target);
									else
										battleContext.prompt();
								}, ["Cancel"], null, hotkeys, "Target: " + currentBattler.identification, function (i, major) {
									foreach(displayAll.filter(onlyPokemon), function (poke) {
										poke.battler.display.outlined = false;
									});
									if (major) {
										foreach(targets[i].affects, function (affected) {
											Display.pokemonInState(battleContext.pokemonInPlace(affected)).battler.display.outlined = true;
										});
									}
								});
							} else {
								if (targets.notEmpty())
									who = targets[0].target;
								else
									who = NoPokemon;
							}
						} else {
							// The move targets an entire side
							var ally = battleContext.allies.contains(currentBattler);
							who = Battles.side[chosenActualMove.targets === Move.targets.bothSides ? "both" : ((chosenActualMove.targets === Move.targets.opposingSide && ally) || (chosenActualMove.targets === Move.targets.alliedSide && !ally) ? "far" : "near")];
						}
					}
					if (who !== null) {
						if (!currentBattler.battler.disobeying) {
							battleContext.actions.push({
								poke : currentBattler,
								priority : chosenActualMove.priority,
								action : function (poke) {
									poke.attemptMove(chosenMove, who);
								}
							});
						}
					} else {
						advance = false;
						reprompt = false;
					}
					break;
				case "Bag":
					if (arguments.length === 1) {
						advance = false;
						reprompt = false;
						if (character.bag.usableItems(true).empty()) {
							Textbox.messageWithId(Textbox.state("You don't have any usable items.")).showTextImmediately = true;
							reprompt = true;
						} else {
							var usableItems = character.bag.usableItems(true), actualItem, items = [], indices = [], hotkeys = {};
							hotkeys[Settings._("keys => secondary")] = "Cancel";
							foreach(usableItems, function (item) {
								actualItem = Items._(item.item);
								if (actualItem.direct) { // If the item can be used directly, instead of when being held
									items.push(actualItem.fullname + " ×" + (item.quantity - item.intentToUse));
									indices.push(character.bag.indexOfItem(item.item));
								}
							});
							Textbox.ask("Which item do you want to use?", items, function (response, i, major) {
								if (response !== "Cancel")
									battleContext.input("Bag", indices[i]);
								else
									battleContext.prompt();
							}, ["Cancel"], null, hotkeys, "Item", null, true);
						}
					} else {
						if (arguments.length === 2 || typeof tertiary === "undefined") {
							var targets = battleContext.targetsForItem(character, Items._(character.bag.items[secondary].item));
							names = [];
							positions = [];
							var displayAll = [].concat(Display.state.current.allies, Display.state.current.opponents), hotkeys = {};
							hotkeys[Settings._("keys => secondary")] = "Cancel";
							foreach(targets, function (poke) {
								names.push(poke.name());
								positions.push(battleContext.placeOfPokemon(poke));
							});
							Textbox.ask("On which Pokémon do you want to use the " + Items._(character.bag.items[secondary].item).fullname + "?", names, function (response, i) {
								if (response !== "Cancel")
									battleContext.input("Bag", secondary, positions[i]);
								else
									battleContext.prompt();
							}, ["Cancel"], null, hotkeys, null, function (i, major) {
								foreach(displayAll.filter(onlyPokemon), function (poke) {
									poke.battler.display.outlined = false;
								});
								if (major) {
									var poke = battleContext.pokemonInPlace(positions[i]);
									if (poke.inBattle())
										Display.pokemonInState(poke).battler.display.outlined = true;
								}
							}, true);
							advance = false;
							reprompt = false;
						}
						if (typeof tertiary !== "undefined" && tertiary !== null) {
							battleContext.actions.push({
								poke : tertiary,
								doesNotRequirePokemonToBeBattling : true,
								priority : 6.1, // Using items should be slightly higher priority than switching Pokémon in
								action : function (poke) {
									character.bag.use(secondary, poke, character);
								},
								undo : function () {
									character.bag.intendToUse(secondary, -1);
								}
							});
							character.bag.intendToUse(secondary);
						}
					}
					break;
				case "Pokémon":
					if (currentBattler.battler.isTrapped()) {
						Textbox.state(currentBattler.name() + " is trapped and cannot switch out!");
						advance = false;
					} else if (arguments.length === 1) {
						names = [];
						positions = [];
						foreach(character.healthyEligiblePokemon(true), function (poke, i) {
							names.push(poke.name());
							positions.push(character.party.pokemon.indexOf(poke));
						});
						advance = false;
						var hotkeys = {};
						hotkeys[Settings._("keys => secondary")] = "Cancel";
						if (names.length) {
							Textbox.ask("Which Pokémon do you want to send out?", names, function (response, i) {
								if (response !== "Cancel")
									battleContext.input("Pokémon", positions[i]);
								else
									battleContext.prompt();
							}, ["Cancel"], null, hotkeys, null, null, true);
							reprompt = false;
						} else {
							Textbox.state("All your Pokémon are already battling, or about to be sent out!");
							reprompt = true;
						}
					}  else {
						if (secondary >= character.pokemon()) {
							Textbox.state("There's no Pokémon in that slot!");
							advance = false;
						} else if (!character.party.pokemon[secondary].conscious()) {
							Textbox.state("That Pokémon is not conscious — you can't use that one!");
							advance = false;
						} else if (currentBattler.battler.isTrapped()) {
							Textbox.state(currentBattler.name() + " is trapped and can't switch out!");
							advance = false;
						} else if (!foreach(character.battlers(), function (battler) {
							if (battler.pokemon === character.party.pokemon[secondary]) {
								Textbox.state("That Pokémon is already battling — you can't send it out again!");
								advance = false;
							}
						})) {
							battleContext.actions.push({
								poke : currentBattler,
								priority : 6,
								action : function (poke) {
									battleContext.swap(poke, character.party.pokemon[secondary]);
								},
								undo : function () {
									currentBattler.battler.switching = false;
									character.party.pokemon[secondary].battler.switching = false;
								}
							});
							currentBattler.battler.switching = true;
							character.party.pokemon[secondary].battler.switching = true;
						}
						else
							advance = false;
					}
					break;
				case "Run":
					if (battleContext.escape(currentBattler))
						advance = false;
					break;
				case "Back":
					var previous = battleContext.actions.pop();
					if (previous.hasOwnProperty("undo"))
						previous.undo();
					battleContext.inputs.pop();
					-- battleContext.selection;
					advance = false;
					break;
				case "Mega Evolve":
				case "Mega Evolve ✓":
					character.megaEvolution = (character.megaEvolution === false ? currentBattler : false);
					advance = false;
					reprompt = true;
					break;
			}
			if (!battleContext.process && character === Game.player) {
				if (advance) {
					var action = {
						action : "command",
						primary : primary
					};
					if (typeof secondary !== "undefined")
						action.secondary = secondary;
					if (typeof tertiary !== "undefined")
						action.tertiary = tertiary;
					var flags = [];
					if (character.megaEvolution === currentBattler)
						flags.push("mega evolve");
					if (flags.notEmpty())
						action.flags = flags;
					battleContext.inputs.push(action);
					battleContext.delegates.Pokémon.disallowPlayerToSwitchPokemon(battleContext);
					battleContext.delegates.Bag.disallowPlayerToUseItem(battleContext);
					battleContext.advance();
				} else if (reprompt) {
					battleContext.prompt();
				}
			}
		},
		playerIsParticipating : function () {
			return !battleContext.process && Game.player !== null && battleContext.alliedTrainers.contains(Game.player);
		},
		flushInputs : function () {
			// Sends any inputs the player has made since the inputs were last flushed, to the server
			// This is done after every set of inputs has been made at the start of the turn, and whenever extra input is required, such as when a Pokémon faints and the player has to decide which one to send out next
			if (battleContext.identifier !== null) {
				foreach(battleContext.inputs, function (input) {
					Relay.pass("relay", [input], battleContext.identifier); // Sends them one at a time because Supervisor prefers that
				});
			}
			battleContext.inputs = [];
		},
		sync : function () {
			// Sends the current state of the battle to the server to make sure there haven't been any disruptions to the battle, especially of a... suspicious manner
			if (battleContext.identifier !== null && battleContext.playerIsParticipating()) {
				var trainers = {};
				foreach(battleContext.allTrainers(), function (character) {
					trainers[character.identification] = character.store();
				});
				Relay.pass("sync", {
					turn : battleContext.turns,
					seed : battleContext.random.seed,
					weather : battleContext.weather,
					trainers : trainers
				}, battleContext.identifier);
			}
		},
		advance : function () {
			if (!battleContext.playerIsParticipating() || ++ battleContext.selection === Game.player.battlers().length) {
				battleContext.queue = battleContext.queue.concat(battleContext.actions);
				battleContext.actions = [];
				if (!battleContext.process) {
					var display = Display.state.save();
					Textbox.effect(function () { Display.state.load(display); });
				}
				battleContext.flushInputs();
				battleContext.waitForActions("command", battleContext.giveTrainersActions);
			} else {
				battleContext.prompt();
			}
		},
		giveTrainersActions : function () {
			foreach(battleContext.allTrainers(), function (character) {
				if (character.isAnNPC())
					battleContext.AI.action(character);
				else if (character.type === Trainers.type.online) {
					for (var i = 0, action; i < character.battlers().length; ++ i) {
						if (!battleContext.pokemonForcedIntoAction(character.battlers()[i])) {
							action = null;
							foreach(battleContext.communication, function (communication, j) {
								if (communication.action === "command" && communication.trainer === character.identification) {
									action = j;
									return true;
								}
							});
							if (action !== null) {
								action = battleContext.communication.remove(action);
								if (action.hasOwnProperty("flags")) {
									foreach(action.flags, function (flag) {
										switch (flag) {
											case "mega evolve":
												battleContext.input("Mega Evolve", null, null, character, i);
												break;
										}
									});
								}
								battleContext.input(action.primary, action.secondary, action.tertiary, character, i);
							}
						}
					}
				}
				if (character.megaEvolution !== false && character.megaEvolution !== true) {
					battleContext.actions.push({
						poke : character.megaEvolution,
						priority : 5.9, // Technically 6, but should occur after switching
						action : function (poke) {
							poke.megaEvolve();
						}
					});
				}
			});
			battleContext.queue = battleContext.queue.concat(battleContext.actions);
			battleContext.actions = [];
			battleContext.processTurn();
		},
		hasCommunicationForTrainers : function (kind, waitingActions) {
			return battleContext.trainersWaitingFor(kind, waitingActions).empty();
		},
		trainersWaitingFor : function (kind, waitingActions) {
			if (typeof waitingActions === "undefined")
				waitingActions = battleContext.communication;
			var requiredActions = {}, communicationIdentifications = {};
			foreach(battleContext.allTrainers(), function (character) {
				if (character.type === Trainers.type.online) {
					var requiredActionsForTrainer = 0;
					switch (kind) {
						case "command":
							for (var i = 0; i < character.battlers().length; ++ i) {
								if (!battleContext.pokemonForcedIntoAction(character.battlers()[i], true)) {
									++ requiredActionsForTrainer;
								}
							}
							break;
						case "send":
							var numberOfPokemonPerTrainer = battleContext.pokemonPerSide() / (battleContext.alliedTrainers.contains(character) ? battleContext.alliedTrainers : battleContext.opposingTrainers).length;
							if (character.battlers().length < numberOfPokemonPerTrainer)
								requiredActionsForTrainer = numberOfPokemonPerTrainer - character.battlers().length;
							break;
						case "learn":
							if (battleContext.delayForInput > 0 && character === battleContext.alliedTrainers.first())
								++ requiredActionsForTrainer;
							break;
						case "evolve":
							if (character === battleContext.alliedTrainers.first())
								requiredActionsForTrainer += battleContext.evolving.length;
							break;
						case "flee":
							if (character === battleContext.alliedTrainers.first())
								++ requiredActionsForTrainer;
							break;
					}
					if (requiredActionsForTrainer) {
						requiredActions[character.identification] = requiredActionsForTrainer;
						communicationIdentifications[character.identification] = character.identification;
					}
				}
			});
			var actionsForTrainers = {};
			foreach(waitingActions, function (communication) {
				if (communication.action === kind) {
					if (!actionsForTrainers.hasOwnProperty(communication.trainer)) {
						actionsForTrainers[communication.trainer] = 0;
					}
					++ actionsForTrainers[communication.trainer];
				}
			});
			var waitingFor = [];
			forevery(requiredActions, function (number, character) {
				if (!actionsForTrainers.hasOwnProperty(character) || actionsForTrainers[character] < number) {
					waitingFor.push(communicationIdentifications[character]);
				}
			});
			return waitingFor;
		},
		communicationForTrainerIsValid : function (team, actions, issues) {
			// This function assumes that all the actions required for this point are sent — i.e. split data packets are not allowed as it makes it difficult to determine the current Pokémon
			var properties = [], requireProperty = function (action, property) {
				if (action.hasOwnProperty(property)) {
					properties.push(property);
					return true;
				} else {
					issues.push("The property `" + property + "` was required but was not found.");
					return false;
				}
			}, isNaturalNumber = function (action, property, below) {
				var variable = _(action, property);
				var isNatural = typeof variable === "number" && variable === Math.floor(variable) && variable >= 0 && (arguments.length < 3 || variable < below);
				if (!isNatural) {
					issues.push("The property `action => " + property + "` should have been a natural number" + (arguments.length < 3 ? "" : " below " + below )+ " but was `" + variable + "`.");
				}
				return isNatural;
			};
			var character = battleContext.trainerOfTeam(team);
			if (character === null) {
				issues.push("There was no trainer with a team equal to `" + team + "`.");
				return false; // This should never be true, as we receive the trainer data from the Supervisor, who is assumed trustworhy
			}
			var inBattle = [], currentBattler, selection = 0;
			foreach(battleContext.all(true), function (poke) {
				if (poke.trainer === character)
					inBattle.push(poke);
			});
			// We need to make changes to some of the trainers and Pokémon during the analysis, so we can things like: has the trainer attempted to use the same item twice, or tried to mega evolve two different Pokémon in one turn?
			// But, of course, these changes can't be permanent, because we need them as they are for the rest of the battle, so we store them in `preservation` to restore at the end of the function
			// `preservation` stores arrow-paths ("a => b => c" etc.) so it can restore them easily afterwards
			var preservation = {
				character : {}, // Relative to `character`
				pokemon : {} // Relative to `battleContext.allTrainers()`
			};
			var isValid = (battleContext.state.kind === "waiting" && !foreach(actions, function (action) {
				if (["command"].contains(battleContext.state.for)) {
					if (selection >= inBattle.length) {
						issues.push("Too many actions have been sent.");
						return true; // We've received too many actions!
					}
					currentBattler = inBattle[selection ++];
				}
				if (!requireProperty(action, "trainer") || !requireProperty(action, "action")) // The `trainer` parameter is effectively guaranteed because Supervisor adds it itself, so we don't need to check that they all match up
					return true;
				switch (battleContext.state.for) {
					case "command":
						if (!requireProperty(action, "primary") || typeof action.primary !== "string" || !["Fight", "Bag", "Pokémon", "Run"].contains(action.primary))
							return true; // Check it has a valid "primary" property
						if (["Fight", "Bag", "Pokémon"].contains(action.primary)) {
							if (!requireProperty(action, "secondary"))
								return true; // Checks it has a "secondary" property
							if (!isNaturalNumber(action, "secondary", action.primary === "Fight" ? currentBattler.usableMoves().length : action.primary === "Bag" ? character.bag.items.length : character.party.pokemon.length))
								return true; // Check the "secondary" property is a valid integer
							var isMultiBattle = battleContext.pokemonPerSide() > 1;
							if (action.primary === "Fight") {
								var move = Moves._(currentBattler.usableMoves()[action.secondary].move);
								if (isMultiBattle && ![Move.targets.opposingSide, Move.targets.alliedSide, Move.targets.bothSides].contains(move.targets)) {
									if (!requireProperty(action, "tertiary"))
										return true;
									if (typeof action.tertiary !== "object") {
										issues.push("The property `action.tertiary` should have been an object, but was actually a `" + typeof action.tertiary + "`.");
										return true;
									}
									if (!action.tertiary.hasOwnProperty("side")) {
										issues.push("The property `action.tertiary.side` was required but was not found.");
										return true;
									}
									if (typeof action.tertiary.side !== "object") {
										issues.push("The property `action.tertiary.side` should have been an object, but was actually a `" + typeof action.tertiary.side + "`.");
										return true;
									}
									if (!action.tertiary.hasOwnProperty("team")) {
										issues.push("The property `action.tertiary.team` was required but was not found.");
										return true;
									}
									if (!isNaturalNumber(action, "tertiary => team"))
										return true;
									if (battleContext.trainerOfTeam(action.tertiary.team) === null) {
										issues.push("There was no trainer with the specified team, `" + ation.tertiary.team + "`.");
										return true;
									}
									if (!action.tertiary.hasOwnProperty("position") || !isNaturalNumber(action, "tertiary => position", battleContext.pokemonPerSide())) {
										issues.push("The value of the property `action.tertiary.position` was invalid.");
										return true;
									}
									var potentialTargets = battleContext.targetsForMove(currentBattler, Moves._(currentBattler.usableMoves()[action.secondary].move), false), actualTarget = battleContext.pokemonInPlace(action.tertiary);
									if (!foreach(potentialTargets, function (target) {
										return target.team === actualTarget.team && target.position === actualTarget.position;
									})) {
										issues.push("There was no Pokémon with the same position and team as the move attempted to target.");
										return true; // The Pokémon that has been selected to attack cannot be targeted with the selected move
									}
								}
							}
							if (action.primary === "Bag") {
								var item = character.bag.items[action.secondary];
								if (!character.bag.usableItems(true).contains(item)) {
									issues.push("The item the player tried to use was not a usable item.");
									return true;
								}
								if (![Move.targets.opposingSide, Move.targets.alliedSide, Move.targets.bothSides].contains(Items._(item.item).targets)) {
									if (!requireProperty(action, "tertiary"))
										return true;
									if (typeof action.tertiary !== "object") {
										issues.push("The property `action.tertiary` should have been an object, but was actually a `" + typeof action.tertiary + "`.");
										return true;
									}
									if (!action.tertiary.hasOwnProperty("team")) {
										issues.push("The property `action.tertiary.team` was required but was not found.");
										return true;
									}
									if (battleContext.trainerOfTeam(action.tertiary.team) === null) {
										issues.push("There was no trainer with the specified team, `" + ation.tertiary.team + "`.");
										return true;
									}
									if (!action.tertiary.hasOwnProperty("position") || !isNaturalNumber(action, "tertiary => position", 6)) // The actual number of position gets checked in the next statements, 6 is really just a placeholder here
										return true;
									var targetedPokemon = battleContext.pokemonInPlace(action.tertiary);
									if (targetedPokemon === null) {
										issues.push("There was no Pokémon in that position.");
										return true;
									}
									if (!action.tertiary.hasOwnProperty("side")) {
										// The item is being used on a Pokémon that is not currently battling
										if (targetedPokemon.inBattle()) {
											issues.push("An item was attempted to be used on a Pokémon that is not battling as if it were.");
											return true; // Tried to use an item on a Pokémon that is not battling as if it were
										}
									} else {
										if (typeof action.tertiary.side !== "object") {
											issues.push("The property `action.tertiary.side` should have been an object, but was actually a `" + typeof action.tertiary.side + "`.");
											return true;
										}
										// The item is being used on a Pokémon that is battling
										if (!targetedPokemon.inBattle()) {
											issues.push("An item was attempted to be used on a Pokémon that is battling as if it were not.");
											return true; // Tried to use an item on a Pokémon that is battling as if it was not
										}
									}
									var potentialTargets = battleContext.targetsForItem(character, Items._(item.item));
									if (!potentialTargets.contains(targetedPokemon)) {
										issues.push("The possible targets for that item did not include the Pokémon that was actually targeted.");
										return true;
									}
									// It has passed all the checks, so can be used
									preservation.character["bag => items => " + action.secondary + " => intentToUse"] = character.bag.items[action.secondary].intentToUse;
									character.bag.intendToUse(action.secondary);
								}
							} 
							if  (action.primary === "Pokémon") {
								// If the player is switching to use a Pokémon, it must be healthy, and the current Pokémon cannot be trapped
								if (character.party.pokemon[action.secondary].battler.battling) {
									issues.push("The player tried to switch to a Pokémon that was already battling.");
									return true;
								}
								if (!character.party.pokemon[action.secondary].conscious()) {
									issues.push("The player tried to switch to a Pokémon that was not conscious.");
									return true;
								}
								if (character.party.pokemon[action.secondary].battler.switching) {
									issues.push("The player tried to switch to a Pokémon that was already switching out.");
									return true;
								}
								if (currentBattler.battler.isTrapped()) {
									issues.push("The player tried to switching out a Pokémon that was trapped.");
									return true; 
								}
								if (!character.healthyEligiblePokemon(true).contains(character.party.pokemon[action.secondary])) {
									issues.push("The player tried to switching out a Pokémon that was not a valid choice.");
									return true; 
								}
								// It has passed all the checks, so can be sent in
								var poke = character.party.pokemon[action.secondary];
								preservation.pokemon[battleContext.allTrainers().indexOf(poke.trainer) + " => party => pokemon => " + poke.trainer.party.pokemon.indexOf(poke) + " => battler => switching"] = false;
								preservation.pokemon[battleContext.allTrainers().indexOf(currentBattler.trainer) + " => party => pokemon => " + currentBattler.trainer.party.pokemon.indexOf(currentBattler) + " => battler => switching"] = false;
								poke.battler.switching = true;
								currentBattler.battler.switching = true;
							}
						}
						if (action.primary === "Run" && (!battleContext.isWildBattle() || currentBattler.battler.isTrapped())) {
							issues.push("The player tried to run in a context in which running is disallowed.");
							return true; // Can only run in certain situations
						}
						if (action.hasOwnProperty("flags")) {
							properties.push("flags");
							if (action.flags.length >= 2 || (action.flags.length === 1 && action.flags.first() !== "mega evolve")) {
								issues.push("Flags were included which were not valid.");
								return true; // The only valid flag at the moment is "mega evolve"
							}
							// Mega Evolution Validation
							if (currentBattler.potentialMegaEvolution(character.megaEvolution === currentBattler) === null) {
								issues.push("The player tried to mega evolve, which is not possible with the current Pokémon.");
								return null;
							}
							// It has passed all the checks, so can be Mega Evolved
							preservation.character.megaEvolution = character.megaEvolution;
							character.megaEvolution = currentBattler;
						} 
						break;
					case "send":
						if (!requireProperty(action, "which") || !isNaturalNumber(action, "which", character.healthyEligiblePokemon(true).length))
							return true;
						// It has passed all the checks, so can be sent in
						var poke = character.healthyEligiblePokemon(true)[action.which];
						preservation.pokemon[battleContext.allTrainers().indexOf(poke.trainer) + " => party => pokemon => " + poke.trainer.party.pokemon.indexOf(poke) + " => battler => switching"] = false;
						poke.battler.switching = true;
						break;
					case "learn":
						if (!requireProperty(action, "forget") || (action.forget !== null && !isNaturalNumber(action, "forget", battleContext.state.data.poke.moves.length)))
							return true;
						break;
					case "evolve":
						if (!requireProperty(action, "prevent") || typeof action.prevent !== "boolean") {
							issues.push("The value of the property `action.prevent` was invalid.");
							return true;
						}
						break;
					case "flee":
						if (!requireProperty(action, "attempted") || typeof action.attempted !== "boolean") {
							issues.push("The value of the property `action.attempted` was invalid.");
							return true;
						}
						break;
				}
				// We've already ensured that every required property is in the keys, so if they're the same length, they must be equal
				if (Object.keys(action).length !== properties.length) {
					issues.push("The communication contained more data than was expected.");
					return true;
				}
			}));
			// Restore preserved properties
			forevery(preservation, function (preserved, key) {
				var object;
				switch (key) {
					case "character":
						object = character;
						break;
					case "pokemon":
						object = battleContext.allTrainers();
						break;
				}
				forevery(preserved, function (value, path) {
					_(object, path, value);
				});
			});
			
			return isValid;
		},
		waitForActions : function (kind, response, data) {
			var wait = function () {
				if (battleContext.hasCommunicationForTrainers(kind)) {
					response();
				} else {
					if (battleContext.state.kind === "waiting") {
						// If the battle is already waiting for some action, then simply queue this one
						var previousResponse = battleContext.state.response;
						battleContext.state.response = function () {
							previousResponse();
							battleContext.waitForActions(kind, response, data);
						};
					} else {
						battleContext.state = {
							"kind" : "waiting",
							"for" : kind,
							"response" : function () {
								battleContext.state = {
									kind : "running"
								};
								if (!battleContext.process) Textbox.update();
								response();
							},
							"data" : typeof data !== "undefined" ? data : null
						};
						if (!battleContext.process) Textbox.stateUntil("Waiting for " + (battleContext.playerIsParticipating() ? "the other player" : "both players") + " to make a decision...", function () {
							return battleContext.state.kind !== "waiting" && Textbox.dialogue.length > 1;
						});
					}
				}
			};
			if (battleContext.process)
				wait();
			else
				Textbox.effect(wait);
		},
		receiveActions : function (actions) {
			// Receive the opponent's actions, in an online battle
			if (actions.notEmpty()) {
				battleContext.communication = battleContext.communication.concat(actions);
				if (battleContext.state.kind === "waiting" && battleContext.hasCommunicationForTrainers(battleContext.state.for)) {
					battleContext.state.response();
				}
			}
		},
		changeWeather : function (weather, lasting) {
			battleContext.weather = {
				current: weather,
				lasting: lasting
			};
			if (!battleContext.process) {
				var currentWeather = battleContext.weather.current;
				Textbox.effect(() => {
					Weather.weather = currentWeather;
					Weather.time = 1;
				});
			}
		},
		pokemonOnSameSide : function (pokeA, pokeB) {
			return pokeA.battler.side === pokeB.battler.side;
		},
		distanceBetween : function (pokeA, pokeB) {
			var posA = (pokeA.battler.side === Battles.side.near ? battleContext.allies.indexOf(pokeA) * 2 : battleContext.opponents.length * 2 - 1 - battleContext.opponents.indexOf(pokeA) * 2), posB = (pokeB.battler.side === Battles.side.near ? battleContext.allies.indexOf(pokeB) * 2 : battleContext.opponents.length * 2 - 1 - battleContext.opponents.indexOf(pokeB) * 2);
			return (Math.abs(Math.floor(posA / 2) - Math.floor(posB / 2)) + ((posA & 1) === (posB & 1) ? 0 : 0.5));
		},
		pokemonInRangeOfMove : function (pokeA, pokeB, move) {
			var range = move.targets, distance = battleContext.distanceBetween(pokeA, pokeB);
			switch (distance) {
				case 0:
					return range.contains(Move.target.self);
				case 0.5:
					return range.contains(Move.target.directOpponent);
				case 1:
					return range.contains(Move.target.adjacentAlly);
				case 1.5:
					return range.contains(Move.target.adjacentOpponent);
				case 2:
					return range.contains(Move.target.farAlly);
				case 2.5:
					return range.contains(Move.target.farOpponent);
				default:
					return false;
			}
		},
		targetsForItem : function (character, item) {
			// Returns an array of all the Pokémon the user could use the item on
			var targetedPokemon = item.targets, targets;
			if (targetedPokemon === Move.targets.party) {
				targets = character.party.pokemon;
			} else if (targetedPokemon === Move.targets.opponents) {
				targets = [];
				foreach(battleContext.alliedTrainers.contains(character) ? battleContext.opponents : battleContext.allies, function (opponent) {
					targets.push(opponent);
				});
				targets.reverse();
			}
			return targets;
		},
		targetsForMove : function (user, move, excludeAlliesIfPossible) {
			// Returns an array of all the Pokémon that the user could target with the move
			if (![Move.targets.opposingSide, Move.targets.alliedSide, Move.targets.bothSides].contains(move.targets)) {
				var inRange = {
					allies : [],
					opponents : []
				}, all = battleContext.all(true);
				foreach(all, function (poke) {
					if (battleContext.pokemonInRangeOfMove(user, poke, move)) {
						(battleContext.pokemonOnSameSide(user, poke) ? inRange.allies : inRange.opponents).push({
							poke : poke,
							place : battleContext.placeOfPokemon(poke)
						});
					}
				});
				return (excludeAlliesIfPossible ? (inRange.opponents.notEmpty() ? inRange.opponents : inRange.allies) : [].concat(inRange.opponents, inRange.allies));
			} else {
				var ally = battleContext.allies.contains(user);
				return [{
					poke : NoPokemon,
					place : move.targets === Move.targets.bothSides ? Battles.side.both : ((move.targets === Move.targets.opposingSide && ally) || (move.targets === Move.targets.alliedSide && !ally) ? Battles.side.far : Battles.side.near)
				}];
			}
		},
		affectedByMove : function (user, target, move) {
			// Returns an array of the Pokémon who will be affected by the user's move if they target a certain Pokémon
			var targets = [], partOfTarget = [], all = battleContext.all();
			if (target !== NoPokemon && battleContext.pokemonInRangeOfMove(user, target, move)) {
				if (move.affects.contains(Move.target.directTarget)) {
					partOfTarget.push(all.indexOf(target));
				}
				foreach(battleContext.alliesTo(user).filter(onlyPokemon), function (poke) {
					var distance = Math.floor(battleContext.distanceBetween(user, poke));
					if (((move.affects.contains(Move.target.self) && distance === 0) || (move.affects.contains(Move.target.adjacentAlly) && distance === 1) || ((move.affects.contains(Move.target.farAlly) && distance === 2))))
						partOfTarget.push(all.indexOf(poke));
				});
				foreach(battleContext.opponentsTo(user).filter(onlyPokemon), function (poke) {
					var distance = Math.floor(battleContext.distanceBetween(user, poke));
					if (((move.affects.contains(Move.target.directOpponent) && distance === 0) || (move.affects.contains(Move.target.adjacentOpponent) && distance === 1) || ((move.affects.contains(Move.target.farOpponent) && distance === 2))))
						partOfTarget.push(all.indexOf(poke));
				});
				partOfTarget = partOfTarget.removeDuplicates().reverse();
			}
			var affected = [];
			foreach(partOfTarget, function (index) {
				affected.push(all[index]);
			});
			return affected;
		},
		pokemonPerSide : function () {
			switch (battleContext.style) {
				case "normal":
				case "sky":
					return 1;
				case "double":
					return 2;
			}
		},
		placeOfPokemon : function (poke) {
			if (poke.inBattle()) {
				return {
					side : poke.battler.side,
					team : poke.trainer.team,
					position : (poke.battler.side === Battles.side.near ? battleContext.allies : battleContext.opponents).indexOf(poke)
				};
			} else {
				return {
					team : poke.trainer.team,
					position : poke.trainer.party.pokemon.indexOf(poke)
				};
			}
		},
		pokemonInPlace : function (place) {
			var pokes;
			if (place.hasOwnProperty("side")) {
				pokes = place.team === battleContext.alliedTrainers.first().team ? battleContext.allies : battleContext.opponents;
			} else {
				pokes = battleContext.trainerOfTeam(place.team).party.pokemon;
			}
			if (place.position < pokes.length) {
				return pokes[place.position];
			} else {
				return null;
			}
		},
		trainerOfTeam : function (team) {
			var trainerOfTeam = null, all = battleContext.allTrainers();
			foreach(all, function (character) {
				if (character.team === team) {
					trainerOfTeam = character;
					return true;
				}
			});
			return trainerOfTeam;
		},
		AI : {
			action : function (character) {
				// Decide whether to use a move, item, switch out, etc.
				foreach(character.battlers(), function (poke) {
					var disobey = poke.battler.disobeying;
					if (!disobey) {
						var usableMoves = poke.usableMoves(), use = battleContext.random.chooseFromArray(usableMoves), useActual = Moves._(use.move), againstWhom;
						againstWhom = battleContext.random.chooseFromArray(battleContext.targetsForMove(poke, useActual, true));
						if (!battleContext.pokemonForcedIntoAction(poke)) {
							battleContext.queue.push({
								poke : poke,
								priority : useActual.priority,
								action : function (poke) {
									poke.attemptMove(use, againstWhom.place);
								}
							});
						}
					}
				});
			}
		},
		pokemonForcedIntoAction : function (poke, doNotQueue) {
			// Check if this Pokémon is forced into making a certain move, because they need to recharge, etc.
			if (poke.battler.recharging) {
				if (!doNotQueue)
					battleContext.queue.push({
						poke : poke,
						priority : 0,
						action : function (poke) {
							if (!battleContext.process) Textbox.state(poke.name() + " must recharge!");
						}
					});
				return true;
			}
			if (poke.battler.moveStage > 0) {
				if (!doNotQueue)
					battleContext.queue.push({
						poke : poke,
						priority : Moves._(poke.battler.previousMoves.last().move).priority,
						action : function (poke) {
							poke.use(poke.battler.previousMoves.last().move, poke.battler.previousTarget);
						}
					});
				return true;
			}
		},
		prompt : function (firstPromptOfTurn) {
			// Get the player to submit an action, such as Fight, or Run, etc.
			if (battleContext.finished)
				return;
			var inBattle = [], currentBattler, allies = battleContext.allies.filter(onlyPokemon);
			foreach(allies, function (poke) {
				if (!poke.trainer.isAnNPC())
					inBattle.push(poke);
			});
			currentBattler = inBattle[battleContext.selection];
			if (battleContext.pokemonForcedIntoAction(currentBattler)) {
				battleContext.advance();
				return;
			} else if (firstPromptOfTurn) {
				battleContext.sync();
			}
			if (battleContext.pokemonPerSide() > 1) {
				currentBattler.battler.display.outlined = true;
				var display = Display.state.save();
				Textbox.effect(function () { Display.state.load(display); });
				currentBattler.battler.display.outlined = false;
			}
			var actions = [], hotkeys = {};
			if (battleContext.delegates.Pokémon.shouldDisplayMenuOption(battleContext)) {
				actions = ["Pokémon"].concat(actions);
			}
			if (battleContext.rules.items === "allowed" && battleContext.delegates.Bag.shouldDisplayMenuOption(battleContext)) {
				actions.push("Bag");
			}
			if (battleContext.isWildBattle() && battleContext.delegates.Run.shouldDisplayMenuOption(battleContext)) {
				actions.push("Run");
				hotkeys[Settings._("keys => secondary")] = "Run";
			}
			var moves = [];
			foreach(currentBattler.usableMoves(), function (move) {
				moves.push(move.move);
			});
			if (battleContext.pokemonPerSide() > 1 && battleContext.selection > 0 && battleContext.delegates.Back.shouldDisplayMenuOption(battleContext))
				actions.insert(2, "Back");
			if (currentBattler.potentialMegaEvolution(currentBattler.trainer.megaEvolution === currentBattler) !== null && battleContext.delegates["Mega Evolve"].shouldDisplayMenuOption(battleContext))
				actions.insert(2, currentBattler.trainer.megaEvolution === false ? "Mega Evolve" : "Mega Evolve ✓");
			Textbox.effect(function () {
				battleContext.delegates.Pokémon.allowPlayerToSwitchPokemon(battleContext, function (switchIn) {
					Textbox.clear();
					battleContext.input("Pokémon", switchIn);
				});
				battleContext.delegates.Bag.allowPlayerToUseItem(battleContext, function (useWhich, onWhom) {
					Textbox.clear();
					battleContext.delegates.Bag.disallowPlayerToUseItem(battleContext);
					battleContext.delegates.Pokémon.disallowPlayerToSwitchPokemon(battleContext);
					battleContext.input("Bag", useWhich, onWhom);
				});
			});
			Textbox.ask("What do you want " + currentBattler.name() + " to do?", moves, function (response, i, major) {
				Textbox.details = null;
				if (major) {
					battleContext.input("Fight", i);
				} else
					battleContext.input(response);
			}, actions, null, hotkeys, "Action: " + currentBattler.identification, function (i, major) {
				if (major && Keys.isHeld(Settings._("keys => tertiary"))) {
					Textbox.details = function (context, left, top, width, height) {
						var move = currentBattler.usableMoves()[i], stats = Moves._(move.move), padding = {
							horizontal : 36,
							vertical : 24
						};
						context.fillStyle = "hsla(0, 0%, 0%, 0.9)";
						context.fillRectHD(left * Game.zoom, top * Game.zoom, width * Game.zoom, height * Game.zoom);
						context.fillStyle = "white";
						context.textBaseline = "top";
						context.textAlign = "left";
						context.font = Font.load(24 * Game.zoom);
						context.fillTextHD(move.move, (left + padding.horizontal) * Game.zoom, (top + padding.vertical) * Game.zoom);
						context.textAlign = "right";
						context.fillTextHD(move.PP + "/" + Move.maximumPP(move.move, move.PPUps), (left + width - padding.horizontal) * Game.zoom, (top + padding.vertical) * Game.zoom);
						context.textAlign = "left";
						context.font = Font.load(18 * Game.zoom);
						context.fillTextHD(stats.type, (left + padding.horizontal) * Game.zoom, (top + padding.vertical + 44) * Game.zoom);
						if (stats.hasOwnProperty("power"))
							context.fillTextHD("Power: " + stats.power, (left + padding.horizontal) * Game.zoom, (top + padding.vertical + 70) * Game.zoom);
						context.textAlign = "right";
						context.fillTextHD(stats.category === Move.category.physical ? "Physical" : stats.category === Move.category.special ? "Special" : stats.category === Move.category.status ? "Status" : "", (left + width - padding.horizontal) * Game.zoom, (top + padding.vertical + 44) * Game.zoom);
						if (stats.hasOwnProperty("accuracy"))
							context.fillTextHD("Accuracy: " + Math.round(stats.accuracy * 100) + "%", (left + width - padding.horizontal) * Game.zoom, (top + padding.vertical + 70) * Game.zoom);
						context.textAlign = "left";
						context.font = Font.load(14 * Game.zoom);
						var lines = Textbox.wrap(stats.description, Textbox.newStyleContext(), [], (width - padding.horizontal * 2) * Game.zoom).split("\n");
						foreach(lines, function (line, i) {
							context.fillTextHD(line, (left + padding.horizontal) * Game.zoom, (top + 128 + 16 * i) * Game.zoom);
						});
					};
				} else {
					Textbox.details = null;
				}
			}, true);
		},
		processTurn : function () {
			battleContext.selection = 0;
			foreach(battleContext.effects.specific, function (effect, i, deletion) {
				if (!effect.target.battler.battling) {
					deletion.push(i);
				} else if ((effect.repeating && effect.due === Battles.when.startOfTurn) || (!effect.repeating && battleContext.turns >= effect.due)) {
					var selfDestructing = [];
					if (effect.hasOwnProperty("data"))
						selfDestructing = effect.type(effect.target, effect.data);
					else
						selfDestructing = effect.type(effect.target);
					if (!effect.repeating)
						deletion.push(i);
					if (Array.isArray(selfDestructing) && selfDestructing.notEmpty()) {
						foreach(battleContext.effects.specific, function (removeAlso, j) {
							if (selfDestructing.contains(removeAlso.data))
								deletion.push(j);
						});
					}
				}
			});
			var all = battleContext.all(true);
			foreach(all, function (poke) {
				if (poke.status !== "frozen" && poke.battler.recharging) {
					if (poke.battler.recharging > 1)
						poke.battler.recharging = 0;
				}
			});
			// Execute all the actions in the queue
			// By the time race() gets to fainted Pokémon, they will be recorded as fainted, so their actions will not execute
			battleContext.race(battleContext.queue);
			battleContext.queue = [];
			battleContext.survey();
			battleContext.endTurn();
		},
		startTurn : function () {
			battleContext.queue = [];
			var all = battleContext.all(true);
			foreach(battleContext.allTrainers(), function (character) {
				// If the trainer is still intending to Mega Evolve after last turn, it means they were unsuccessful, and they still have the chance to do it this turn
				if (character.megaEvolution !== true)
					character.megaEvolution = false;
			});
			foreach(all, function (poke) {
				foreach(battleContext.opponentsTo(poke).filter(onlyPokemon), function (opponent) {
					poke.battler.opponents.pushIfNotAlreadyContained(opponent);
					opponent.battler.opponents.pushIfNotAlreadyContained(poke);
				});
			});
			foreach(all.filter(function (poke) {
				return poke.battler.battlingForDuration === 0;
			}), function (poke) {
				battleContext.queue.push({
					poke : poke,
					priority : 0,
					action : function (poke) {
						battleContext.triggerEvent(Triggers.entrance, {}, poke);
					}
				});
			});
			battleContext.race(battleContext.queue);
			battleContext.queue = [];
			var all = battleContext.all(true);
			all.sort(function (a, b) {
				return a.trainer.team - b.trainer.team;
			});
			foreach(all, function (poke) {
				var disobey = poke.disobey();
				poke.battler.disobeying = disobey ? disobey : false;
				if (disobey) {
					battleContext.actions.push({
						poke : poke,
						priority : 0,
						action : function (poke) {
							if (poke.notHinderedByAilments(poke))
								disobey(poke);
						}
					});
				}
			});
			battleContext.endDelay();
		},
		endDelay : function () {
			if (battleContext.delayForInput === 0) {
				if (battleContext.finished) {
					var effect = function () {
						battleContext.end(battleContext.endingFlags);
					};
					if (!battleContext.process) Textbox.effect(effect);
					else effect();
				} else {
					if (battleContext.playerIsParticipating()) {
						battleContext.prompt(true);
					} else {
						battleContext.advance();
					}
				}
			}
		},
		endTurn : function () {
			if (!battleContext.active || battleContext.finished)
				return;
			foreach(battleContext.effects.near, function (effect, i, deletion) {
				if (battleContext.turns >= Math.floor(effect.expiration)) {
					if (!battleContext.process) Textbox.state(battleContext.alliedTrainers[0].possessivePronoun(true) + effect.type + " ran out.");
					deletion.push(i);
				}
			});
			foreach(battleContext.effects.far, function (effect, i, deletion) {
				if (battleContext.turns >= Math.floor(effect.expiration)) {
					if (!battleContext.process) Textbox.state(battleContext.opposingTrainers[0].possessivePronoun(true) + effect.type + " ran out.");
					deletion.push(i);
				}
			});
			foreach(battleContext.effects.specific, function (effect, i, deletion) {
				if (!effect.target.battler.battling) {
					deletion.push(i);
				} else if ((effect.repeating && effect.due === Battles.when.endOfTurn) || (!effect.repeating && battleContext.turns >= Math.floor(effect.due))) {
					if (!effect.target.fainted()) {
						var selfDestructing = [];
						if (!effect.expired) {
							if (effect.hasOwnProperty("data"))
								selfDestructing = effect.type(effect.target, effect.data);
							else
								selfDestructing = effect.type(effect.target);
						}
						if (!effect.repeating || effect.expired)
							deletion.push(i);
						if (Array.isArray(selfDestructing) && selfDestructing.notEmpty()) {
							foreach(battleContext.effects.specific, function (removeAlso, j) {
								if (selfDestructing.contains(removeAlso.data))
									deletion.push(j);
							});
						}
					} else
						deletion.push(i);
				}
			});
			battleContext.survey();
			var all = battleContext.all(true);
			foreach(all, function (poke) {
				if (!battleContext.active || battleContext.finished)
					return true;
				++ poke.battler.battlingForDuration;
				if (poke.status !== "frozen" && poke.status !== "asleep" && !poke.flinching && !poke.battler.recharging) {
					foreach(poke.currentMoves(), function (move) {
						if (move.disabled) {
							if (-- move.disabled === 0 && !battleContext.process)
								Textbox.state(poke.name() + "'s " + move.move + " was re-enabled!");
						}
					});
				}
				switch (poke.status) {
					case "burned":
						if (!battleContext.process) Textbox.state(poke.name() + " is hurt by " + poke.possessivePronoun() + " burn!");
						battleContext.damage(poke, Move.percentageDamage(poke, 1 / 8));
						break;
					case "poisoned":
						if (!battleContext.process) Textbox.state(poke.name() + " is hurt by the poison!");
						battleContext.damage(poke, Move.percentageDamage(poke, 1 / 8));
						break;
					case "badly poisoned":
						if (!battleContext.process) Textbox.state(poke.name() + " is hurt by the toxic poison!");
						battleContext.damage(poke, Move.percentageDamage(poke, poke.battler.poison / 16));
						++ poke.battler.poison;
						break;
				}
				if (poke.battler.recharging)
					++ poke.battler.recharging;
				if (poke.battler.protected)
					poke.battler.protected = false;
				if (poke.battler.flinching)
					poke.battler.flinching = false;
				poke.battler.damaged[Move.category.all] = 0;
				poke.battler.damaged[Move.category.physical] = 0;
				poke.battler.damaged[Move.category.special] = 0;
			});
			battleContext.survey();
			if (!battleContext.process) {
				battleContext.display.weather = true;
				var displayWeather = Display.state.save();
				Textbox.effect(function () { Display.state.load(displayWeather); });
			}
			var all = battleContext.all(true);
			if (battleContext.weather.lasting !== null) {
				if (-- battleContext.weather.lasting === 0) {
					if (!battleContext.process) {
						Textbox.state("The sky cleared up!");
						battleContext.changeWeather("clear skies", null);
					}
				}
			}
			switch (battleContext.weather.current) {
				case "intense sunlight":
					if (!battleContext.process && !Settings._("visual weather effects"))
						Textbox.state("The sun is blazing fiercely in the sky!");
					break;
				case "rain":
					if (!battleContext.process && !Settings._("visual weather effects"))
						Textbox.state("The rain is pouring down in torrents!");
					break;
				case "sandstorm":
					if (!battleContext.process && !Settings._("visual weather effects"))
						Textbox.state("The sandstorm is raging all around!");
					foreach(all, function (poke) {
						if (!battleContext.active || battleContext.finished)
							return true;
						if (!poke.ofType("Steel", "Rock", "Ground")) {
							if (!battleContext.process) Textbox.state(poke.name() + " was damaged by the sandstorm!");
							battleContext.damage(poke, {
								damage : Math.ceil(poke.maximumHealth() / 16),
								infiltrates : true
							});
						}
					});
					break;
				case "hail":
					if (!battleContext.process && !Settings._("visual weather effects"))
						Textbox.state("The hail is falling heavily!");
					foreach(all, function (poke) {
						if (!battleContext.active || battleContext.finished)
							return true;
						if (!poke.ofType("Ice")) {
							if (!battleContext.process) Textbox.state(poke.name() + " was damaged by the hail!");
							battleContext.damage(poke, {
								damage : Math.ceil(poke.maximumHealth() / 16),
								infiltrates : true
							});
						}
					});
					break;
			}
			if (!battleContext.process) {
				battleContext.display.weather = false;
				var displayAfterWeather = Display.state.save();
				Textbox.effect(function () { Display.state.load(displayAfterWeather); });
			}
			battleContext.survey();
			battleContext.fillEmptyPlaces(true); // Fill the player's empty places
		},
		fillEmptyPlaces : function (player, alreadyAttemptedToEscape) {
			if (player) {
				if (battleContext.playerIsParticipating()) {
					var character = Game.player, progress = false;
					var emptyPlaces = [];
					foreach(battleContext.allies, function (poke, i) {
						if (poke === NoPokemon)
							emptyPlaces.push(i);
					});
					if (emptyPlaces.notEmpty()) {
						var healthyEligiblePokemon = character.healthyEligiblePokemon(true);
						if (healthyEligiblePokemon.length > emptyPlaces.length) {
							var names = [], positions = [];
							foreach(character.healthyEligiblePokemon(true), function (poke, i) {
								names.push(poke.name());
								positions.push(i);
							});
							if (names.empty()) {
								progress = true;
							} else {
								var chooseToSendOut = function (which) {
									if (battleContext.isWildBattle() && !alreadyAttemptedToEscape) {
										battleContext.inputs.push({
											action : "flee",
											attempted : false
										});
									}
									battleContext.inputs.push({
										action : "send",
										which : which
									});
									battleContext.flushInputs();
									battleContext.delegates.Pokémon.disallowPlayerToSwitchPokemon(battleContext);
									battleContext.enter(character.healthyEligiblePokemon(true)[which], true, emptyPlaces.first());
									battleContext.fillEmptyPlaces(true, true);
								};
								if (!battleContext.delegates.Pokémon.shouldDisplayMenuOption(battleContext)) {
									names = [];
								}
								Textbox.effect(function () {
									battleContext.delegates.Pokémon.allowPlayerToSwitchPokemon(battleContext, function (switchIn) {
										Textbox.clear();
										chooseToSendOut(character.healthyEligiblePokemon(true).indexOf(character.party.pokemon[switchIn]));
									});
								});
								Textbox.ask("Which Pokémon do you want to send out?", names, function (response, i, major) {
									if (major) {
										chooseToSendOut(i);
									} else {
										battleContext.inputs.push({
											action : "flee",
											attempted : true
										});
										battleContext.flushInputs();
										battleContext.escape(character.mostRecentlyFaintedPokemon);
										battleContext.queue.push({
											priority : 0,
											action : function () {
												if (!battleContext.finished) {
													battleContext.fillEmptyPlaces(true, true);
												}
											}
										});
										battleContext.race(battleContext.queue);
										battleContext.queue = [];
									}
								}, battleContext.isWildBattle() && !alreadyAttemptedToEscape ? ["Run"] : [], null, null, null, null, true);
							}
						} else {
							var sendOutRemainingPokemon = function () {
								foreach(healthyEligiblePokemon, function (poke) {
									battleContext.enter(poke, true, emptyPlaces.shift());
								});
							};
							if (battleContext.isWildBattle() && !alreadyAttemptedToEscape) {
								Textbox.ask("Do you want to escape?", ["Fight"], function (response) {
									if (response === "Fight") {
										battleContext.inputs.push({
											action : "flee",
											attempted : false
										});
										battleContext.flushInputs();
										sendOutRemainingPokemon();
										battleContext.fillEmptyPlaces(false, true);
									} else {
										battleContext.inputs.push({
											action : "flee",
											attempted : true
										});
										battleContext.flushInputs();
										battleContext.escape(character.mostRecentlyFaintedPokemon);
										battleContext.queue.push({
											priority : 0,
											action : function () {
												if (!battleContext.finished) {
													sendOutRemainingPokemon();
													battleContext.fillEmptyPlaces(false, true);
												}
											}
										});
										battleContext.race(battleContext.queue);
										battleContext.queue = [];
									}
								}, ["Flee"], null, null, null, null, true);
							} else {
								sendOutRemainingPokemon();
								progress = true;
							}
						}
					} else
						progress = true;
					if (progress) {
						battleContext.flushInputs();
						battleContext.fillEmptyPlaces(false); // Fill the NPCs' empty places
					}
				} else {
					battleContext.fillEmptyPlaces(false); // Fill the NPCs' empty places
				}
			} else {
				var anyQueries = false, emptyPlaces;
				// Queueing here is necessary so that the player can switch out their Pokémon before the opponent if the "switching chance" setting is on
				foreach(battleContext.allTrainers(), function (character) {
					var emptyPlaces = [];
					foreach(battleContext.alliedTrainers.contains(character) ? battleContext.allies : battleContext.opponents, function (poke, i) {
						if (poke === NoPokemon)
							emptyPlaces.push(i);
					});
					if (emptyPlaces.notEmpty()) { // If the opponent needs to send out a Pokémon
						if (character.type === Trainers.type.NPC) {
							var sendingOut = 0;
							while (character.battlers().length + sendingOut < Math.min(battleContext.pokemonPerSide() / battleContext.opposingTrainers.length) && character.hasHealthyEligiblePokemon(true) && emptyPlaces.length) {
								var poke = character.healthyEligiblePokemon(true).first(), immediatelyAfter;
								if (!battleContext.isCompetitiveBattle() && Settings._("switching chance")) {
									var character = Game.player;
									if (character.healthyEligiblePokemon(true).notEmpty()) {
										if (!poke.trainer.isWild())
											Textbox.state(character.name + " is about to send out " + poke.name() + ".");
										else
											Textbox.state("A wild " + poke.name() + " is about to appear!");
										anyQueries = true;
										immediatelyAfter = Textbox.confirm("Do you want to switch a different Pokémon in?", function (yes) {
											if (yes) {
												var names = [], positions = [];
												foreach(character.healthyEligiblePokemon(true), function (poke, i) {
													names.push(poke.name());
													positions.push(character.party.pokemon.indexOf(poke));
												});
												var hotkeys = {}, appendAfter;
												hotkeys[Settings._("keys => secondary")] = "Cancel";
												Textbox.insertAfter(appendAfter = Textbox.ask("Which Pokémon do you want to switch in?", names, function (response, i) {
													if (response !== "Cancel") {
														if (character.battlers().length > 1) {
															names = [];
															foreach(character.battlers(), function (replace) {
																names.push(replace.name());
															});
															Textbox.insertAfter(Textbox.ask("Which Pokémon do you want to switch out for " + character.party.pokemon[positions[i]].name() + "?", names, function (response, j) {
																if (response !== "Cancel") {
																	battleContext.queue.push({
																		poke : poke,
																		doesNotRequirePokemonToBeBattling : true,
																		priority : 2,
																		action : function (which, withWhat) {return function () {
																			battleContext.swap(character.battlers()[which], character.party.pokemon[positions[withWhat]]);
																		}; }(j, i)
																	});
																	battleContext.continueToNextTurn(false);
																} else battleContext.continueToNextTurn(false);
															}, ["Cancel"], null, hotkeys, null, null, true), appendAfter);
														} else {
															battleContext.queue.push({
																poke : poke,
																doesNotRequirePokemonToBeBattling : true,
																priority : 2,
																action : function (which) {return function () {
																	battleContext.swap(character.battlers().first(), character.party.pokemon[positions[which]]);
																}; }(i)
															});
															battleContext.continueToNextTurn(false);
														}
													} else battleContext.continueToNextTurn(false);
												}, ["Cancel"], null, hotkeys, null, null, true), immediatelyAfter);
											} else battleContext.continueToNextTurn(false);
										}, null, null, null, true);
									}
								}
								var pressureSpeech = (character.healthyEligiblePokemon().length === 1 && character._("pressure speech?"));
								battleContext.queue.push({
									poke : poke,
									doesNotRequirePokemonToBeBattling : true,
									priority : 1,
									action : function (which) {return function () {
										battleContext.enter(which, true, emptyPlaces.shift());
										if (!battleContext.process && pressureSpeech) {
											Textbox.effect(function () {
												character.display.visible = true;
											}, battleContext.drawing.transition(poke.trainer.display.position, "x", -(battleContext.style === "double" ? 80 : 40), Settings._("switch transition duration") * Time.framerate));
											var moveBack;
											Textbox.spiel(character._("pressure speech"), function () {
												moveBack = battleContext.drawing.transition(poke.trainer.display.position, "x", -200, Settings._("switch transition duration") * Time.framerate);
											}, function () {
												return moveBack();
											}, function () {
												character.display.visible = false;
											});
											Textbox.say("", 0); // Little hack to make sure the right textbox displays, not the next (menu) one
										}
									}; }(poke)
								});
								poke.battler.switching = true;
								++ sendingOut;
							}
						} else if (character.type === Trainers.type.online) {
							var continueWithBattle = function () {
								var healthyEligiblePokemon = character.healthyEligiblePokemon(true);
								if (healthyEligiblePokemon.length > emptyPlaces.length) {
									battleContext.waitForActions("send", function () {
										battleContext.continueToNextTurn(true);
									});
								} else {
									foreach(healthyEligiblePokemon, function (poke, which) {
										battleContext.enter(poke, true, emptyPlaces.shift());
										battleContext.continueToNextTurn(false);
									});
								}
							};
							if (battleContext.isWildBattle()) {
								battleContext.waitForActions("flee", function () {
									var actionNumber = null;
									foreach(battleContext.communication, function (communication, j) {
										if (communication.action === "flee" && communication.trainer === character.identification) {
											actionNumber = j;
											return true;
										}
									});
									if (actionNumber !== null) {
										var action = battleContext.communication.remove(actionNumber);
										if (action.attempted) {
											battleContext.escape(character.mostRecentlyFaintedPokemon);
											battleContext.queue.push({
												priority : 0,
												action : function () {
													if (!battleContext.finished) {
														continueWithBattle();
													}
												}
											});
											battleContext.race(battleContext.queue);
											battleContext.queue = [];
										} else {
											continueWithBattle();
										}
									}
								});
								anyQueries = true;
							} else {
								continueWithBattle();
								anyQueries = true;
							}
						}
					}
				});
				if (!anyQueries)
					battleContext.continueToNextTurn(false);
			}
		},
		continueToNextTurn : function (sendOutNonPlayerPokemon) {
			if (sendOutNonPlayerPokemon) {
				var emptyPlaces = {
					near : [],
					far : []
				};
				foreach(battleContext.allies, function (poke, i) {
					if (poke === NoPokemon)
						emptyPlaces.near.push(i);
				});
				foreach(battleContext.opponents, function (poke, i) {
					if (poke === NoPokemon)
						emptyPlaces.far.push(i);
				});
				foreach(battleContext.allTrainers(), function (character) {
					if (character.type === Trainers.type.online) {
						var ally = battleContext.alliedTrainers.contains(character), numberOfPokemonPerTrainer = battleContext.pokemonPerSide() / (ally ? battleContext.alliedTrainers : battleContext.opposingTrainers).length;
						while (character.battlers().length < numberOfPokemonPerTrainer --) {
							var actionNumber = null;
							foreach(battleContext.communication, function (communication, j) {
								if (communication.action === "send" && communication.trainer === character.identification) {
									actionNumber = j;
									return true;
								}
							});
							if (actionNumber !== null) {
								var action = battleContext.communication.remove(actionNumber);
								battleContext.enter(character.healthyEligiblePokemon(true)[action.which], true, emptyPlaces[ally ? "near" : "far"].shift());
							} else break;
						}
					}
				});
			}
			battleContext.race(battleContext.queue);
			battleContext.queue = [];
			if (battleContext.survey()) {
				battleContext.fillEmptyPlaces(true);
			} else {
				++ battleContext.turns;
				battleContext.startTurn();
			}
		},
		damage : function (poke, damage, displayMessages) {
			var amount = damage.damage;
			if (amount < 0)
				return;
			if (damage.effectiveness === 0) {
				if (!battleContext.process) Textbox.state("It doesn't affect " + poke.name() + "!");
				return;
			}
			amount = Math.floor(amount);
			if (poke.battler.substitute > 0 && !damage.infiltrates) {
				if (!battleContext.process) Textbox.state(poke.name() + "'s Substitute took the damage!");
				poke.battler.substitute -= amount;
				if (poke.battler.substitute <= 0) {
					if (!battleContext.process) Textbox.state(poke.name() + "'s Substitute broke!");
					poke.battler.substitute = 0;
				}
				return;
			}
			var previousHealth = poke.health;
			poke.health = Math.max(0, poke.health - amount);
			if (typeof damage.category !== "undefined" && damage.category !== null) {
				poke.battler.damaged[damage.category] += amount;
			}
			poke.battler.damaged[Move.category.all] += amount;
			if (!battleContext.process) {
				var display = Display.state.save();
				if (Settings._("status transition duration") > 0) {
					var track = { completed : false }, flashes = 3, damageAnimation = function (state, poke, track, progress, iteration) {
						switch (iteration % 3) {
							case 0:
								poke.battler.display.overlay = "black";
								break;
							case 1:
								poke.battler.display.overlay = null;
								poke.battler.display.opacity = 0;
								break;
							case 2:
								poke.battler.display.opacity = 1;
								break;
						}
						if (progress >= 1) {
							track.completed = true;
							poke.battler.display.overlay = null;
						} else {
							setTimeout(function () {
								damageAnimation(state, poke, track, progress + 1 / (flashes * 3), iteration + 1);
							}, Settings._("status transition duration") * Time.seconds / (flashes * 3));
						}
					};
					Textbox.effect(function () {
						damageAnimation(Display.state.current, Display.pokemonInState(poke), track, 0, 0);
						return track;
					});
				}
				Textbox.effect(function () { return Display.state.transition(display); });
			}
			if (!battleContext.process) {
				if (damage.critical)
					Textbox.state("It's a critical hit!");
				if (arguments.length < 3 || displayMessages) {
					switch (damage.effectiveness) {
						case 4:
							Textbox.state("It's super effective!");
							break;
						case 2:
							Textbox.state("It's super effective!");
							break;
						case 1:
							break;
						case 0.5:
							Textbox.state("It's not very effective...");
							break;
						case 0.25:
							Textbox.state("It's not very effective...");
							break;
					}
				}
			}
			if (!poke.fainted()) {
				battleContext.triggerEvent(Triggers.health, {
					change : -amount
				}, damage.cause, poke);
			}
		},
		survey : function () {
			/*
				battleContext.survey() looks at all the Pokémon after a move has been used to check whether any of the Pokémon should faint.
				This means that fainting happens when all Pokémon have been damaged, rather than after each individual effect of damage
				has been dealt out.
			*/
			if (!battleContext.finished) {
				var cleanedUp = false, drawnBattle = !battleContext.alliedTrainers.first().hasHealthyEligiblePokemon() && !battleContext.opposingTrainers.first().hasHealthyEligiblePokemon();
				foreach(battleContext.all(true), function (poke) {
					if (poke.fainted()) {
						poke.battler.display.transition = 0;
						poke.battler.display.height = 0;
						if (!battleContext.process) {
							var displayFaint = Display.state.save();
							Textbox.state(poke.name() + " fainted!", function () { return Display.state.transition(displayFaint); });
						}
						poke.alterFriendship(-1);
						poke.mega = null;
						poke.trainer.mostRecentlyFaintedPokemon = poke;
						battleContext.removeFromBattle(poke, drawnBattle);
						cleanedUp = true;
					}
				});
				if (drawnBattle) {
					if (!battleContext.process) {
						if (battleContext.isWildBattle()) {
							Textbox.state(battleContext.alliedTrainers.first().pronoun(true) + " defeated the wild Pokémon, but at heavy costs...");
						} else {
							Textbox.state("What?! There aren't any Pokémon left to fight!");
							Textbox.state("The battle is a complete draw!");
						}
					}
					var effect = function () {
						battleContext.end({
							"outcome" : "draw"
						});
					};
					if (!battleContext.process)
						Textbox.effect(effect);
					else effect();
					battleContext.finish();
				}
				return cleanedUp;
			} else {
				return false;
			}
		},
		heal : function (poke, amount, cause) {
			if (amount < 0)
				return;
			amount = Math.ceil(amount);
			if (battleContext.triggerEvent(Triggers.health, {
				change : amount
			}, cause, poke).contains(true))
				return;
			poke.health = Math.min(poke.maximumHealth(), poke.health + amount);
			if (!battleContext.process) {
				var message = "Some of " + poke.name() + "'s health was restored.";
				if (poke.battler.battling) {
					var display = Display.state.save();
					Textbox.state(message, function () { return Display.state.transition(display); });
				} else Textbox.state(message);
			}
		},
		healPercentage : function (poke, percentage, cause) {
			battleContext.heal(poke, poke.maximumHealth() * percentage, cause);
		},
		escapeAttempts : 0,
		escape : function (currentBattler) {
			if (!battleContext.isWildBattle()) {
				if (!battleContext.process) Textbox.state("You can't run from a trainer battle!");
				return true;
			}
			if (currentBattler.inBattle() && currentBattler.battler.isTrapped()) { // It's possible for the player to escape right after one of their Pokémon faints
				battleContext.queue.push({
					priority : 6, action : function () {
						if (!battleContext.process) Textbox.state(currentBattler.name() + " is trapped and can't escape!");
					}
				});
			} else {
				var maxSpeed = 0;
				foreach(battleContext.opponents.filter(onlyPokemon), function (poke) {
					if (poke.stats.speed(true) > maxSpeed)
						maxSpeed = poke.stats.speed(true);
				});
				var escapeChance = (currentBattler.stats.speed(true) * 32) / ((maxSpeed / 4) % 256) + 30 * (battleContext.escapeAttempts ++);
				if (escapeChance > 255 || battleContext.random.int(255) < escapeChance) {
					battleContext.queue.push({
						priority : 6,
						action : function () {
							var effect = function () {
								battleContext.end({
									"outcome" : "escape"
								});
							};
							if (!battleContext.process) Textbox.state(battleContext.alliedTrainers.first().pronoun(true) + " escaped successfully!", effect);
							else effect();
							battleContext.finish();
						}
					});
				} else {
					battleContext.queue.push({priority : 6, action : function () {
						if (!battleContext.process) Textbox.state(battleContext.alliedTrainers.first().pronoun(true) + " couldn't get away!");
					}});
				}
			}
		},
		attemptCapture : function (poke, ball, character) {
			if (arguments.length < 3)
				character = Game.player;
			var OPower = character.OPowers["Capture"];
			var modifiers = {
				status : 1,
				species : poke.currentProperty("catch rate"),
				ball : (typeof ball["catch rate"] === "number" ? ball["catch rate"] : ball["catch rate"]()),
				grass : 1,
				OPower : (OPower === 1 ? 1.5 : OPower === 2 ? 2 : OPower === 3 ? 2.5 : 1)
			};
			switch (poke.status) {
				case "asleep":
				case "frozen":
					modifiers.status = 2.5;
					break;
				case "paralysed":
				case "poisoned":
				case "badly poisoned":
				case "burned":
					modifiers.status = 1.5;
					break;
			}
			var criticalCaptureChance = 1, criticalCapture = false;
			if (character.dex.caught.length > 600) {
				modifiers.grass = 1;
				criticalCaptureChance *= 2.5;
			} else if (character.dex.caught.length > 450) {
				criticalCaptureChance *= 2;
				modifiers.grass = 3686/4096;
			} else if (character.dex.caught.length > 300) {
				criticalCaptureChance *= 1.5;
				modifiers.grass = 3277/4096;
			} else if (character.dex.caught.length > 150) {
				criticalCaptureChance *= 1;
				modifiers.grass = 2867/4096;
			} else if (character.dex.caught.length > 30) {
				criticalCaptureChance *= 0.5;
				modifiers.grass = 2048/4096;
			} else {
				criticalCaptureChance *= 0;
				modifiers.grass = 1229/4096;
			}
			if (battleContext.encounterTile !== "dark grass")
				modifiers.grass = 1;
			var modifiedCatchRate = (((3 * poke.maximumHealth() - 2 * poke.health) * modifiers.grass * modifiers.species * modifiers.ball) / (3 * poke.maximumHealth())) * modifiers.status * modifiers.OPower, shakeProbability = 65536 / Math.pow(255 / modifiedCatchRate, 0.1875), caught = true;
			criticalCaptureChance *= modifiedCatchRate;
			if (battleContext.random.number(255) < criticalCapture)
				criticalCapture = true;
			var shakes;
			if (modifiedCatchRate < 255) {
				for (shakes = 0; shakes < (criticalCapture ? 1 : 4); ++ shakes) {
					if (battleContext.random.number(65535) > shakeProbability) {
						caught = false;
						break;
					}
				}
			} else
				shakes = 4;
			if (!caught) {
				if (!battleContext.process) {
					switch (shakes) {
						case 0:
							Textbox.state((character === Game.player ? "Oh no! " : "") + "The Pokémon broke free!");
							break;
						case 1:
							Textbox.state((character === Game.player ? "Aww! " : "") + "It appeared to be caught!");
							break;
						case 2:
							Textbox.state((character === Game.player ? "Aargh! " : "") + "Almost had it!");
							break;
						case 3:
							Textbox.state((character === Game.player ? "Gah! " : "") + " It was so close, too!");
							break;
					}
				}
			} else {
				if (!battleContext.process) {
					poke.battler.display.transition = 0;
					var display = Display.state.save();
					Textbox.state((character === Game.player ? "Gotcha! " : "") + poke.name() + " was caught!", function () { return Display.state.transition(display); });
				}
				var previousTrainer = poke.trainer;
				poke.caught.ball = ball;
				character.give(poke);
				if (!battleContext.process) {
					var displayAfterCaught = Display.state.save();
					Textbox.effect(() => Display.state.load(displayAfterCaught));
				}
				poke.trainer = previousTrainer;
				battleContext.removeFromBattle(poke, false);
				poke.trainer = character;
			}
			return caught;
		},
		removeFromBattle : function (poke, drawnBattle) {
			// Stops a Pokémon battling, either because they've fainted, or because they've been caught in a Poké ball
			if (!battleContext.isCompetitiveBattle()) {
				poke.battler.opponents = poke.battler.opponents.filter(function (opponent) {
					return !opponent.fainted();
				});
				foreach(poke.battler.opponents, function (gainer) {
					if (gainer.gainExperience(poke, poke.battler.opponents.length, true)) // If a level was gained
						battleContext.levelUppers.pushIfNotAlreadyContained(gainer);
				});
			}
			var place;
			if (poke.battler.side === Battles.side.near) {
				place = battleContext.allies.indexOf(poke);
				battleContext.allies[place] = NoPokemon;
			} else {
				place = battleContext.opponents.indexOf(poke);
				battleContext.opponents[place] = NoPokemon;
			}
			poke.battler.reset();
			var character = poke.trainer;
			if (!character.hasHealthyEligiblePokemon(false, poke)) {
				var playerHasBeenDefeated = (character === battleContext.alliedTrainers.first()), trainerBattle = !battleContext.isWildBattle(), playerName = !battleContext.process ? battleContext.alliedTrainers.first().pronoun(true) : null, endBattleFlags;
				var opponents = [];
				if (trainerBattle) {
					foreach(battleContext.opposingTrainers, function (opposer) {
						opponents.push(opposer.fullname());
					});
				}
				if (!drawnBattle) {
					if (playerHasBeenDefeated) {
						if (!battleContext.process) {
							if (trainerBattle)
								Textbox.state(opponents + " " + (opponents.length !== 1 ? "have" : "has") + " defeated " + (!battleContext.process ? battleContext.alliedTrainers.first().pronoun(false) : null) + "!");
							else
								Textbox.state(playerName + " " + (character === Game.player ? "have" : "has") + " been defeated by the wild Pokémon!");
						}
						if (!battleContext.isCompetitiveBattle()) {
							var highestLevel = 0;
							foreach(character.party.pokemon, function (pkmn) {
								if (pkmn.level > highestLevel)
									highestLevel = pkmn.level;
							});
							var basePayout;
							switch (Math.min(8, character.badges.length)) { // May have greater than 8 badges due to multiple regions
								case 0: basePayout = 8; break;
								case 1: basePayout = 16; break;
								case 2: basePayout = 24; break;
								case 3: basePayout = 36; break;
								case 4: basePayout = 48; break;
								case 5: basePayout = 64; break;
								case 6: basePayout = 80; break;
								case 7: basePayout = 100; break;
								case 8: basePayout = 120; break;
							}
							var OPower = battleContext.opposingTrainers.first().OPowers["Prize Money"], priceOfDefeat = highestLevel * basePayout * (OPower === 1 ? 1.5 : OPower === 2 ? 2 : OPower === 3 ? 3 : 1);
							if (character.money > 0) {
								priceOfDefeat = Math.min(priceOfDefeat, character.money);
								if (!battleContext.process) Textbox.state(playerName + " " + (trainerBattle ? "paid out" : "dropped") + " $" + priceOfDefeat + " " + (trainerBattle ? "to " + commaSeparatedList(opponents) : "in " + character.possessiveGenderPronoun() + " panic to get away") + ".");
								battleContext.alliedTrainers.first().money -= priceOfDefeat;
							} else if (trainerBattle) {
								if (!battleContext.process) Textbox.state(playerName + " didn't have any money to pay " + opponents + "!");
							}
							if (!battleContext.alliedTrainers.first().hasHealthyPokemon()) // Not necessarily true for Sky Battles
								if (!battleContext.process) Textbox.state(playerName + " blacked out!");
						}
						endBattleFlags = {
							"outcome" : "opposing victory"
						};
					} else {
						if (!battleContext.process) Textbox.state(playerName + " " + (battleContext.alliedTrainers.first() !== Game.player ? "has" : "have") + " defeated " + (trainerBattle ? opponents : "the wild Pokémon") + "!");
						if (trainerBattle) {
							if (!battleContext.process) {
								foreach(battleContext.opposingTrainers, function (opposer, i) {
									Textbox.effect(function () {
										character.display.visible = true;
									}, battleContext.drawing.transition(character.display.position, "x", 0, Settings._("switch transition duration") * Time.framerate));
									Textbox.spiel(opposer._("defeat speech"));
									if (i !== battleContext.opposingTrainers.length - 1) {
										Textbox.effect(null, battleContext.drawing.transition(character.display.position, "x", -200, Settings._("switch transition duration") * Time.framerate), function () {
											character.display.visible = false;
										});
									}
								});
							}
							if (!battleContext.isCompetitiveBattle()) {
								var prizeMoney = 0, OPower = battleContext.alliedTrainers.first().OPowers["Prize Money"];
								foreach(battleContext.opposingTrainers, function (opposer) {
									prizeMoney += opposer.party.pokemon.last().level * Classes[opposer.class].payout;
								});
								prizeMoney *= (OPower === 1 ? 1.5 : OPower === 2 ? 2 : OPower === 3 ? 3 : 1);
								if (!battleContext.process) Textbox.state(opponents + " paid " + battleContext.alliedTrainers.first().pronoun(false) + " $" + prizeMoney + " as a reward.");
								battleContext.alliedTrainers.first().money += prizeMoney;
							}
						}
						endBattleFlags = {
							"outcome" : "allied victory"
						};
					}
					battleContext.endingFlags = endBattleFlags;
					battleContext.finish();
					battleContext.endDelay();
					return;
				}
			}
		},
		swap : function (out, replacement, forced) {
			battleContext.enter(replacement, false, battleContext.withdraw(out, forced));
		},
		enter : function (poke, startOrEndOfTurn, place, initial) {
			battleContext.participants.pushIfNotAlreadyContained(poke);
			poke.battler.reset();
			poke.battler.battling = true;
			poke.battler.battle = battleContext;
			var ally = battleContext.alliedTrainers.contains(poke.trainer);
			poke.battler.side = (ally ? Battles.side.near : Battles.side.far);
			if (arguments.length < 3 || place === null) {
				if (ally) {
					if (battleContext.allies.indexOf(NoPokemon) !== -1)
						battleContext.allies[battleContext.allies.indexOf(NoPokemon)] = poke;
					else
						battleContext.allies.push(poke);
				} else {
					if (battleContext.opponents.indexOf(NoPokemon) !== -1)
						battleContext.opponents[battleContext.opponents.indexOf(NoPokemon)] = poke;
					else
						battleContext.opponents.push(poke);
				}
			} else {
				if (ally)
					battleContext.allies[place] = poke;
				else
					battleContext.opponents[place] = poke;
			}
			// The start of the battle
			if (!battleContext.process) {
				if (!poke.trainer.isWild()) {
					poke.battler.display.transition = 0;
					var displayInitial = Display.state.save();
					poke.battler.display.transition = 1;
					var display = Display.state.save();
					Textbox.state(poke.trainer.pronoun(true) + " sent out " + poke.name() + "!");
				} else if (!initial) {
					var displayInitial = Display.state.save();
					Textbox.state("A wild " + poke.name() + " was right behind!", function () { Display.state.load(displayInitial); });
				}
				if (initial) {
					Textbox.effect(null, battleContext.drawing.transition(poke.trainer.display.position, "x", -200, Settings._("switch transition duration") * Time.framerate), function () {
						poke.trainer.display.visible = false;
					});
				}
				if (!poke.trainer.isWild())
					Textbox.effect(function () { Display.state.load(displayInitial); return Display.state.transition(display); });
				Textbox.effect(function () {
					poke.cry();
				});
			}
			foreach(battleContext.opponentsTo(poke), function (opponent) {
				poke.battler.opponents.pushIfNotAlreadyContained(opponent);
				opponent.battler.opponents.pushIfNotAlreadyContained(poke);
			});
			foreach((poke.battler.side === Battles.side.near ? battleContext.hazards.near : battleContext.hazards.far), function (hazard) {
				hazard.type.effects.hazard(poke, hazard.stack);
			});
			if (initial) {
				var OPowers = 0, takeEffect = {};
				foreach(Stats.all, function (stat) {
					if (poke.trainer.OPowers[stat] !== 0) {
						++ OPowers;
						takeEffect[stat] = poke.trainer.OPowers[stat];
					}
				});
				if (OPowers > 0) {
					if (!battleContext.process) Textbox.state((poke.trainer === Game.player ? "Your" : poke.trainer.fullname() + "'s") + " O-Power" + (OPowers === 1 ? " is" : "s are") + " taking effect!");
					forevery(takeEffect, function (change, stat) {
						battleContext.stat(poke, stat, change, poke);
					});
				}
			}
			if (!startOrEndOfTurn)
				battleContext.triggerEvent(Triggers.entrance, {}, poke);
			battleContext.recoverFromStatusInDueCourse(poke);
		},
		withdraw : function (poke, forced) {
			if (!battleContext.process) {
				poke.battler.display.transition = 0;
				var display = Display.state.save();
			}
			var place;
			if (poke.battler.side === Battles.side.near) {
				place = battleContext.allies.indexOf(poke);
				battleContext.allies[place] = NoPokemon;
			} else {
				place = battleContext.opponents.indexOf(poke);
				battleContext.opponents[place] = NoPokemon;
			}
			poke.battler.reset();
			if (!poke.fainted() && !battleContext.process) {
				var displayWithdrawn = Display.state.save();
				Textbox.state((!forced ? (Game.player === poke.trainer ? "Come back " + poke.name() + "!" : poke.trainer.name + " withdrew " + poke.name() + ".") : poke.name() + " was forced to retreat from the battle!"), function () { return Display.state.transition(display); }, null, function () { Display.state.load(displayWithdrawn); });
			}
			return place;
		},
		race : function (entrants, action) {
			foreach(entrants, function (entrant) {
				if (entrant.hasOwnProperty("poke") && !(entrant.poke instanceof pokemon))
					entrant.poke = battleContext.pokemonInPlace(entrant.poke);
			});
			entrants.sort(function (a, b) {
				if (a.hasOwnProperty("poke") && b.hasOwnProperty("poke")) {
					return a.poke.trainer.team - b.poke.trainer.team;
				}
			});
			foreach(entrants, function (entrant) { // If Pokémon have exactly the same speed, they should go randomly
				if (entrant.hasOwnProperty("poke")) {
					entrant.poke.battler.speed = battleContext.random.number(0.5);
				}
			});
			entrants.sort(function (a, b) {
				if (a.priority !== b.priority)
					return b.priority - a.priority;
				else {
					if (a.hasOwnProperty("poke") && b.hasOwnProperty("poke"))
						return (Math.floor(b.poke.stats.speed(true) * (b.poke.status === "paralysed" ? 0.25 : 1)) + b.poke.battler.speed) - (Math.floor(a.poke.stats.speed(true) * (a.poke.status === "paralysed" ? 0.25 : 1)) + a.poke.battler.speed);
					else
						return 0;
				}
			});
			while (entrants.notEmpty()) {
				var racer = entrants.shift();
				if (!battleContext.active || battleContext.finished)
					return true;
				if (racer.hasOwnProperty("poke") && (!racer.poke.battler.battling && !racer.doesNotRequirePokemonToBeBattling))
					return;
				if (action)
					action(racer.poke);
				else
					racer.action(racer.poke);
				battleContext.survey();
			}
		},
		triggerEvent : function (event, data, cause, subjects) {
			if (arguments.length < 4)
				subjects = battleContext.all(true);
			subjects = wrapArray(subjects);
			var responses = [];
			foreach(subjects, function (poke) {
				// The Pokémon being targeted are checked for responses to the ability
				responses = responses.concat(poke.respondToEvent(event, data, cause));
				data.oneself = (cause === poke);
				// Any effects that might be in effect (e.g. Light Screen) are checked for responses to the ability
				foreach((poke.battler.side === Battles.side.near ? battleContext.effects.near : battleContext.effects.far), function (effect) {
					if (effect.type.uponTrigger.event === event)
						if (!effect.type.uponTrigger.hasOwnProperty("oneself") || effect.type.uponTrigger.oneself === data.oneself)
							responses.push(effect.type.uponTrigger.action(data, poke));
				});
			});
			return responses;
		},
		stat : function (poke, stat, change, cause) {
			// A change of zero will reset the stat
			if (poke.battler.substitute > 0 && cause !== poke) {
				if (!battleContext.process) Textbox.state(poke.name() + "'s Substitute isn't affected by the stat change.");
				return;
			}
			if (battleContext.triggerEvent(Triggers.stat, {
				stat : stat,
				change : change
			}, cause, poke).contains(true))
				return true;
			if (change !== 0) {
				if (Math.abs(poke.battler.statLevel[stat]) === 6 && Math.sign(change) === Math.sign(poke.battler.statLevel[stat])) {
					if (!battleContext.process) Textbox.state(poke.name() + "'s " + stat + " can't go any " + (change > 0 ? "higher" : "lower") + "!");
					return;
				}
				poke.battler.statLevel[stat] += change;
				poke.battler.statLevel[stat] = Math.clamp(-6, poke.battler.statLevel[stat], 6);
				if (!battleContext.process) Textbox.state(poke.name() + "'s " + stat + " was " + (Math.abs(change) > 1 ? "sharply " : "") + (change > 0 ? "raised" : "lowered") + ".");
			} else {
				poke.battler.statLevel[stat] = 0;
				if (!battleContext.process) Textbox.state(poke.name() + "'s " + stat + " was reset.");
			}
		},
		teammates : function (pokeA, pokeB) {
			return battleContext.alliesTo(pokeA) === battleContext.alliesTo(pokeB);
		},
		flinch : function (poke) {
			if (!poke.battler.flinching && poke.battler.substitute === 0)
				poke.battler.flinching = true;
		},
		confuse : function (poke) {
			if (!poke.fainted()) {
				if (poke.battler.confused) {
					if (!battleContext.process) Textbox.state(poke.name() + " is already confused!");
				} else {
					if (!battleContext.process) Textbox.state(poke.name() + " has become confused!");
					poke.battler.confused = true;
					battleContext.haveEffect(function (target) {
						if (!battleContext.process) Textbox.state(target.name() + " snapped out of " + target.possessivePronoun() + " confusion!");
						target.battler.confused = false;
					}, battleContext.random.int(1, 4), poke);
				}
			}
		},
		infatuate : function (poke, objectOfPassion) {
			if (!poke.fainted()) {
				if (poke.battler.infatuated) {
					if (!battleContext.process) Textbox.state(poke.name() + " is already infatuated!");
					return true;
				} else if ((poke.gender === "male" && objectOfPassion.gender === "female") || (poke.gender === "female" && objectOfPassion.gender === "male")) {
					if (!battleContext.process) Textbox.state(poke.name() + " has become infatuated!");
					poke.battler.infatuated = true;
					battleContext.haveEffect(function (target) {
						if (!battleContext.process) Textbox.state(target.name() + " broke out of " + target.possessivePronoun() + " infatuation!");
						target.battler.infatuated = false;
					}, battleContext.random.int(1, 4), poke);
					return true;
				} else {
					return false;
				}
			}
			return true;
		},
		placeHazard : function (hazard, maximum, side) {
			var hazardSide = (side === Battles.side.near ? battleContext.hazards.near : battleContext.hazards.far), maxedOut = false;
			if (!foreach(hazardSide, function (which) {
				if (which.type ===  Moves._(hazard)) {
					if (which.stack < maximum)
						++ which.stack;
					else
						maxedOut = true;
					return true;
				}
			}))
				hazardSide.push({
					type : Moves._(hazard),
					stack : 1
				});
			return !maxedOut;
		},
		bringIntoEffect : function (effect, duration, side) {
			var effectSide = (side === Battles.side.near ? battleContext.effects.near : battleContext.effects.far);
			if (!foreach(effectSide, function (which) {
				if (which.type === effect) {
					which.expiration = battleContext.turns + duration;
					return true;
				}
			}))
				effectSide.push({
					type : effect,
					expiration : battleContext.turns + duration
				});
		},
		moveHaveEffect : function (move, when, target, data, repeating) {
			if (!repeating)
				repeating = false;
			if (data)
				battleContext.effects.specific.push({
					type : Moves._(move).effects.effect,
					due : (!repeating ? battleContext.turns : 0) + when,
					target : target,
					data : data,
					expired : false,
					repeating : repeating
				});
			else
				battleContext.effects.specific.push({
					type : Moves._(move).effects.effect,
					due : (!repeating ? battleContext.turns : 0) + when,
					target : target,
					expired : false,
					repeating : repeating
				});
		},
		moveHaveRepeatingEffect : function (move, when, target, data) {
			battleContext.moveHaveEffect(move, when, target, data, true);
		},
		moveHasEffect : function (move, target) {
			return battleContext.hasEffect(Moves._(move).effects.effect, target);
		},
		haveEffect : function (effect, when, target) {
			battleContext.effects.specific.push({type : effect, due : battleContext.turns + when, target : target, expired : false});
		},
		hasEffect : function (effect, target) {
			return foreach(battleContext.effects.specific, function (which) {
				if (which.type === effect && which.target === target)
					return true;
			});
		},
		hasEffectOnSide : function (effect, side) {
			side = (side === Battles.side.near ? battleContext.effects.near : battleContext.effects.far);
			return foreach(side, function (which) {
				if (which.type === effect)
					return true;
			});
		},
		inflict : function (poke, status, force, selfInflicted) {
			var types = poke.currentProperty("types");
			if ((poke.status === "none" || force) && (status !== "burned" || !types.contains("Fire")) && (status !== "paralysed" || !types.contains("Electric")) && (status !== "frozen" || !types.contains("Ice")) && ((status !== "poisoned" && status !== "badly poisoned") || (!types.contains("Poison") && !types.contains("Steel")))) {
				if (!poke.fainted()) {
					if (!battleContext.process && !selfInflicted) Textbox.state(poke.name() + " was " + (status !== "asleep" ? status : "put to sleep") + "!");
					poke.status = status;
					battleContext.recoverFromStatusInDueCourse(poke);
				}
				return true;
			} else {
				if (!poke.fainted() && !battleContext.process) {
					Textbox.state("But " + poke.name() + " was not " + status + "!");
				}
				return false;
			}
		},
		recoverFromStatusInDueCourse : function (poke) {
			if (poke.status === "asleep") {
				battleContext.haveEffect(function (target) {
					if (!battleContext.process) Textbox.state(target.name() + " woke up!");
					target.status = "none";
				}, battleContext.random.int(1, 3), poke);
			}
		},
		isWildBattle : function () {
			return battleContext.opposingTrainers.length === 1 && battleContext.opposingTrainers.first().isWild();
		},
		isCompetitiveBattle : function () {
			return battleContext.flags.contains("competitive");
		}
	}, visual);
	
	return battleContext;
}

/*
	All delegates:
		shouldDislayMenuOption(battle)
		[battleIsBeginning(battle)]
		[battleIsEnding(battle)]
*/
BattleContext.defaultDelegates = {
	Fight : {
		shouldDisplayMenuOption : (battle) => true
	},
	Pokémon : {
		/*
			allowPlayerToSwitchPokemon(battle, callback(switchIn))
			disallowPlayerToSwitchPokemon(battle)
			[pokemonHaveUpdated(pokes)]
		*/
		shouldDisplayMenuOption : (battle) => true,
		allowPlayerToSwitchPokemon (battle, callback) {
		},
		disallowPlayerToSwitchPokemon (battle) {
		}
	},
	Bag : {
		/*
			allowPlayerToUseItem(battle, callback(item, poke))
			disallowPlayerToUseItem(battle)
			[itemsHaveUpdated(items)]
		*/
		shouldDisplayMenuOption : (battle) => true,
		allowPlayerToUseItem (battle, callback) {
		},
		disallowPlayerToUseItem (battle, callback) {
		}
	},
	Run : {
		shouldDisplayMenuOption : (battle) => true
	},
	Back : {
		shouldDisplayMenuOption : (battle) => true
	},
	"Mega Evolve" : {
		shouldDisplayMenuOption : (battle) => true
	}
};
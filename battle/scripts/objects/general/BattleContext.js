//? BattleContext will now need to deal with all the other Textbox.ask situations like learning new moves, (preventing) evolving, etc.
//? Any stuff that's if (kind !== online) is not dealt with, so battle replays will have to be taken into account later
//? Trainer type should be elimated entirely. Battle kind can probably be eliminated too, as online battles are no different than trainer house battles, etc.
//? Do regular syncing
//? Validating relay and sync dataOf
//? Allow a mixture of NPC and online opponents when switching out new Pokémon to fill empty places
//? Check order of "send" / "command" messages are correct (or are valid at that point in time)
//? Allow "switching chance" on server.
//? Experience doesn't save properly
//? TheWild is global (has global party)
//? catching pokes sets caught correctly?
//? pressure speech does not work in multiplayer

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
				var shadowCanvas = battleContext.sketching[1], shadowContext = shadowCanvas.getContext("2d");
				shadowContext.textAlign = "center";
				shadowContext.textBaseline = "bottom";
				for (var i = 0; i < battleContext.sketching.length; ++ i)
					battleContext.sketching[i].getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
				originalContext.fillStyle = context.fillStyle = "black";
				originalContext.fillRect(0, 0, originalCanvas.width, originalCanvas.height);
				if (battleContext.state.kind !== "inactive") {
					if (battleContext.state.kind === "loading") {
						originalContext.fillStyle = "hsl(0, 0%, 20%)";
						originalContext.fillRect(40 * Game.zoom, originalCanvas.height / 2 - 10 * Game.zoom, originalCanvas.width - 80 * Game.zoom, 20 * Game.zoom);
						originalContext.fillStyle = "hsl(0, 0%, 90%)";
						originalContext.fillRect(40 * Game.zoom, originalCanvas.height / 2 - 10 * Game.zoom, (originalCanvas.width - 80 * Game.zoom) * battleContext.state.progress, 20 * Game.zoom);
						originalContext.textAlign = "center";
						originalContext.textBaseline = "middle";
						originalContext.font = Font.load(12 * Game.zoom);
						originalContext.strokeStyle = "hsl(0, 0%, 90%)";
						originalContext.lineWidth = 5;
						originalContext.strokeText((battleContext.state.progress * 100).toFixed(0) + "%", originalCanvas.width / 2, originalCanvas.height / 2);
						originalContext.fillStyle = "black";
						originalContext.fillText((battleContext.state.progress * 100).toFixed(0) + "%", originalCanvas.width / 2, originalCanvas.height / 2);
						if (battleContext.state.failed.notEmpty()) {
							originalContext.textBaseline = "top";
							originalContext.fillStyle = "hsl(0, 0%, 90%)";
							originalContext.fillText("Failed to load " + battleContext.state.failed.length + " file" + (battleContext.state.failed.length !== 1 ? "s" : "") + ":", originalCanvas.width / 2, originalCanvas.height / 2 + (20 + 6) * Game.zoom);
							originalContext.fillStyle = "hsl(0, 0%, 50%)";
							foreach(battleContext.state.failed, function (failed, i) {
								originalContext.fillText(failed, originalCanvas.width / 2, originalCanvas.height / 2 + (20 + 6 + 16 * (i + 1)) * Game.zoom);
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
							Sprite.draw(canvas, battleContext.state.evolving.paths.sprite("front"), canvas.width / 2, canvas.height / 2, true, null, null, now);
						if (battleContext.state.stage === "finishing" || battleContext.state.stage === "after")
							Sprite.draw(canvas, battleContext.state.into.paths.sprite("front"), canvas.width / 2, canvas.height / 2, true, null, null, now);
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
							battleContext.state.stage = "finishing";
							battleContext.state.transition = 4;
						}
						if (battleContext.state.stage === "finishing" && battleContext.state.transition <= 0) {
							battleContext.state.stage = "after";
							battleContext.state.evolving.evolve(battleContext.state.into._("species"));
							var effect = function () {
								battleContext.continueEvolutions();
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
							Sprite.draw(canvas, battleContext.state.evolving.paths.sprite("front"), canvas.width / 2, canvas.height / 2, true, [{ type : "fill", colour : "white" }, { type : "opacity", value : fade }], new Matrix().scale(scale), now);
						}
						if (battleContext.state.stage !== "before" && battleContext.state.stage !== "preparation") {
							var scale = 1, fade = 0;
							if (battleContext.state.stage === "finishing")
								fade = battleContext.state.transition;
							if (battleContext.state.stage === "evolving") {
								fade = Math.sin(battleContext.state.transition * (transformationRate / 2) + Math.PI * 1.25) > 0 ? 1 : 0;
								scale = 1 + Math.sin(battleContext.state.transition * transformationRate) * 0.5;
							}
							Sprite.draw(canvas, battleContext.state.into.paths.sprite("front"), canvas.width / 2, canvas.height / 2, true, [{ type : "fill", colour : "white" }, { type : "opacity", value : fade }], new Matrix().scale(scale), now);
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
						Sprite.draw(battleContext.sketching[2], Scenes._(battleContext.scene).paths.sprite(), 0, 0);
						context.textAlign = "center";
						context.textBaseline = "bottom";
						context.lineWidth = 2;
						context.strokeStyle = "white";
						var shadowOpacity = Lighting.shadows.opacity(), shadowMatrix = new Matrix ([1, 0.1, -0.6, 0.4, 0, 0]), matrix = new Matrix(), position, transition, side, generalMatrix;
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
							// Shadow
							Sprite.draw(shadowCanvas, poke.paths.sprite(side), position.x, battleContext.drawing.positions[poke.battler.side === Battles.side.near ? "sideNear" : "sideFar"].y - position.z, true, [{ type : "fill", colour : "hsla(0, 0%, 0%, " + (1 - Math.min(1, position.height / (canvas.height / Game.zoom / 2))) + ")" }, { type : "crop", heightRatio : poke.battler.display.height }], generalMatrix.multiply(shadowMatrix).scale(Math.pow(2, - position.height / (canvas.height / Game.zoom / 4))), now, true);
							// Outline
							if (poke.battler.display.outlined) {
								for (var angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
									Sprite.draw(canvas, poke.paths.sprite(side), position.x + Math.cos(angle) * context.lineWidth, position.y - position.z + Math.sin(angle) * context.lineWidth, true, [{ type : "fill", colour : context.strokeStyle }, { type : "crop", heightRatio : poke.battler.display.height }], generalMatrix, now);
								}
							}
							// Pokémon
							var filters = [];
							if (poke._("shiny"))
								filters.push({ type : "filter", kind : "shiny", pokemon : poke });
							filters.push({ type : "crop", heightRatio : poke.battler.display.height });
							Sprite.draw(canvas, poke.paths.sprite(side), position.x, position.y - position.z, true, filters, generalMatrix, now);
							// Lighting
							if (Scenes._(battleContext.scene).hasOwnProperty("lighting"))
								Sprite.draw(canvas, poke.paths.sprite(side), position.x, position.y - position.z, true, [{ type : "fill", colour : Scenes._(battleContext.scene).lighting }, { type : "crop", heightRatio : poke.battler.display.height }], generalMatrix, now);
							// Glow / Fade
							if (transition > 0 && transition < 1)
								Sprite.draw(canvas, poke.paths.sprite(side), position.x, position.y - position.z, true, [{ type : "fill", colour : "white" }, { type : "opacity", value : Math.pow(1 - transition, 0.4) }, { type : "crop", heightRatio : poke.battler.display.height }], generalMatrix, now);
						});
						// Trainers
						foreach(battleContext.allTrainers(), function (trainer) {
							if (trainer !== TheWild && trainer.display.visible) {
								position = battleContext.drawing.position(trainer, now);
								side = (battleContext.alliedTrainers.contains(trainer) ? "back" : null);
								// Shadow
								Sprite.draw(shadowCanvas, trainer.paths.sprite(side), position.x, position.y - position.z + trainer.display.position.y, true, { type : "fill", colour : "black" }, shadowMatrix.scale(position.scale).scale(Math.pow(2, -trainer.display.position.y / 100)), now);
								// Trainer
								Sprite.draw(canvas, trainer.paths.sprite(side), position.x, position.y - position.z, true, null, matrix.scale(position.scale), now);
								// Lighting
								if (Scenes._(battleContext.scene).hasOwnProperty("lighting"))
									Sprite.draw(canvas, trainer.paths.sprite(side), position.x, position.y - position.z, true, { type : "fill", colour : Scenes._(battleContext.scene).lighting }, matrix.scale(position.scale), now);
							}
						});
						if (sortDisplay.allies.length === 0 || sortDisplay.opponents.length === 0) {
							foreach(battleContext.allTrainers(), function (trainer) {
								if (trainer !== TheWild && trainer.display.visible) {
									drawAfterwards.push(function (canvas) {
										battleContext.drawing.partyBar(canvas, trainer, battleContext.alliedTrainers.contains(trainer), battleContext.alliedTrainers.contains(trainer) ? 120 : 30);
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
								context.fillRect(0, 0, canvas.width, canvas.height);
							});
						}
					}
				} else {
					return;
				}
				var smallContext = battleContext.sketching[3].getContext("2d");
				smallContext.save();
				smallContext.translate(canvas.width / 2, canvas.height / 2);
				var transformation = new Matrix().rotate(View.angle);
				transformation.applyToContext(smallContext);
				var drawSketchingCanvas = function (i) {
					smallContext.drawImage(battleContext.sketching[i], - (View.position.x + canvas.width * (View.zoom - 1) / 2) - canvas.width / 2, - (View.position.y + canvas.height * (View.zoom - 1) / 2) - canvas.height / 2, canvas.width * View.zoom, canvas.height * View.zoom);
				};
				drawSketchingCanvas(2);
				smallContext.globalAlpha = shadowOpacity;
				drawSketchingCanvas(1)
				smallContext.globalAlpha = 1;
				drawSketchingCanvas(0);
				smallContext.restore();
				originalContext.drawImage(battleContext.sketching[3], (originalCanvas.width - canvas.width * Game.zoom) / 2, (originalCanvas.height - canvas.height * Game.zoom) / 2, canvas.width * Game.zoom, canvas.height * Game.zoom);
				foreach(drawAfterwards, function (drawing) {
					drawing(originalCanvas);
				});
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
		style : null,
		flags : [],
		allies : [],
		alliedTrainers : [],
		opponents : [],
		opposingTrainers : [],
		participants : [],
		levelUppers : [],
		weather : null,
		turns : 0,
		callback : null,
		encounterTile : null,
		selection : 0,
		delayForInput : false, // Delay asking the player what they'd like to do until a potentially breaking change has been made (such as learning a new move, which needs to wait, so that the new move will show up in the Pokémon's move list)
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
							context.lineTo(canvas.width * (right ? 1 : 0) + ((current.x - (width * (1 - shift))) * Game.zoom) * (right ? -1 : 1), (y + current.y) * Game.zoom);
						});
						context.fill();
					}
					if (shape.hasOwnProperty("text")) {
						context.font = shape.font;
						context.textAlign = shape.align.x;
						context.textBaseline = shape.align.y;
						context.fillText(shape.text, canvas.width * (right ? 1 : 0) + ((shape.position.x - (width * (1 - shift))) * Game.zoom) * (right ? -1 : 1), (y + shape.position.y) * Game.zoom);
					}
				});
			},
			partyBar : function (canvas, trainer, right, y) {
				var context = canvas.getContext("2d");
				var shapes = [
					{
						points : [{ x : 0, y : -8 }, { x : 102 }, { x : 118, y : 8 }, { x : 0 }],
						colour : "hsla(0, 0%, 0%, 0.6)"
					}
				];
				var transition = 1 - trainer.display.position.x / -200;
				battleContext.drawing.complexShape(canvas, shapes, right, y, transition);
				for (var i = 0, pos; i < trainer.party.pokemon.length; ++ i) {
					pos = (!right ? 0 : canvas.width) + (12 + i * 16 - 118 * (1 - transition)) * Game.zoom * (!right ? 1 : -1);
					context.fillStyle = !trainer.party.pokemon[i].fainted() ? "red" : "grey";
					context.fillCircle(pos, y * Game.zoom, 4 * Game.zoom);
					context.fillStyle = "white";
					context.fillCircle(pos, y * Game.zoom, 4 * Game.zoom, Math.PI);
					context.fillStyle = context.strokeStyle = "black";
					context.beginPath();
					context.moveTo(pos - 4 * Game.zoom, y * Game.zoom);
					context.lineTo(pos + 4 * Game.zoom, y * Game.zoom);
					context.lineWidth = 0.75;
					context.stroke();
					context.fillCircle(pos, y * Game.zoom, 1.75 * Game.zoom);
					context.fillStyle = "white";
					context.fillCircle(pos, y * Game.zoom, 1 * Game.zoom);
					if (trainer.party.pokemon[i].fainted()) {
						context.fillStyle = "hsla(0, 0%, 0%, 0.3)";
						context.fillCircle(pos, y * Game.zoom, 4 * Game.zoom);
					}
				}
			},
			bar : function (canvas, poke, right, y, detailed) {
				var context = canvas.getContext("2d"), pixelWidth = 16, percentageHealth = poke.health / poke.maximumHealth(), percentageExperience = poke.experience / poke.experienceFromLevelToNextLevel();
				do {
					context.font = pixelWidth + "px " + Settings._("font").typeface
					pixelWidth -= 1;
				} while (context.measureText(poke.name()).width > 60);
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
						colour : (percentageHealth > 1 / 2 ? "hsl(110, 100%, 40%)" : percentageHealth > 1 / 4 ? "hsl(40, 100%, 50%)" : "hsl(0, 100%, 50%)")
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
			position : function (entity, time) {
				var position = {};
				if (entity instanceof pokemon) {
					var poke = entity, display = Display.state.current, attributes = poke.currentProperty("attributes"), floating = (attributes.hasOwnProperty("floating") ? attributes.floating.height + (attributes.floating.hasOwnProperty("deviation") && attributes.floating.hasOwnProperty("period") && poke.battler.display.position.y === 0 ? Math.sin(time * (2 * Math.PI) / (attributes.floating.period * Time.second)) * attributes.floating.deviation : 0) : 0);
					var ally = display.allies.contains(entity), place, count = battleContext.pokemonPerSide();
					if (ally) {
						place = display.allies.indexOf(poke);
						position.z = battleContext.drawing.positions.sideNear.z + poke.battler.display.position.z;
						position.scale = 2 / Math.pow(2, position.z / (battleContext.drawing.positions.sideFar.z - battleContext.drawing.positions.sideNear.z));
						position.x = battleContext.drawing.positions.sideNear.x + poke.battler.display.position.x * position.scale + place * 100 - (count - 1) * 40;
						position.height = poke.battler.display.position.y + floating;
						position.y = battleContext.drawing.positions.sideNear.y - position.height * position.scale;
					} else {
						place = display.opponents.indexOf(poke);
						position.z = battleContext.drawing.positions.sideFar.z - poke.battler.display.position.z;
						position.scale = 2 / Math.pow(2, position.z / (battleContext.drawing.positions.sideFar.z - battleContext.drawing.positions.sideNear.z));
						position.x = battleContext.drawing.positions.sideFar.x - poke.battler.display.position.x * position.scale - place * 80 + (count - 1) * 40;
						position.height = poke.battler.display.position.y + floating;
						position.y = battleContext.drawing.positions.sideFar.y - position.height * position.scale;
					}
				} else {
					var trainer = entity;
					position = battleContext.drawing.positions;
					if (battleContext.alliedTrainers.contains(trainer)) {
						position = {
							x : battleContext.drawing.positions.sideNear.x + trainer.display.position.x,
							y : battleContext.drawing.positions.sideNear.y - trainer.display.position.y,
							z : battleContext.drawing.positions.sideNear.z + trainer.display.position.z,
							height : trainer.display.position.y
						};
					} else {
						position = {
							x : battleContext.drawing.positions.sideFar.x - trainer.display.position.x,
							y : battleContext.drawing.positions.sideFar.y - trainer.display.position.y,
							z : battleContext.drawing.positions.sideFar.z - trainer.display.position.z,
							height : trainer.display.position.y
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
		load : function (alliedTrainers, opposingTrainers, settings) {
			battleContext.state = {
				kind : "loading",
				progress : 0,
				failed : []
			};
			var resources = [Scenes._(settings.scene).paths.sprite(true)], loaded = 0;
			foreach([].concat(alliedTrainers, opposingTrainers), function (trainer) {
				resources.push(trainer.paths.sprite(alliedTrainers.contains(trainer) ? "back" : null, true));
				foreach(trainer.party.pokemon, function (poke) {
					resources.push(poke.paths.sprite("front", true), poke.paths.sprite("back", true), poke.paths.cry(true));
				});
			});
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
			TheWild.party.empty();
			foreach(pokes, function (poke) {
				TheWild.give(poke);
			});
			battleContext.initiate(alliedTrainers, TheWild, settings, callback);
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
					settings.weather = "clear";
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
				battleContext.changeWeather(settings.weather);
				alliedTrainers = wrapArray(alliedTrainers);
				opposingTrainers = wrapArray(opposingTrainers);
				battleContext.alliedTrainers = alliedTrainers;
				battleContext.opposingTrainers = opposingTrainers;
				if (foreach(battleContext.alliedTrainers, function (participant) {
					participant.display.visible = true;
					participant.megaEvolution = "possible";
					if (!participant.hasHealthyEligiblePokemon(battleContext.style)) {
						battleContext.active = true;
						battleContext.finish();
						battleContext.end(false, {
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
					participant.megaEvolution = "possible";
					if (!participant.hasHealthyEligiblePokemon(battleContext.style)) {
						battleContext.active = true;
						battleContext.finish();
						battleContext.end(false, {
							"outcome" : "illegal battle"
						});
						return true;
					} else {
						for (var i = 0, newPoke; i < Math.min(battleContext.pokemonPerSide() / battleContext.opposingTrainers.length, participant.healthyEligiblePokemon().length); ++ i) {
							newPoke = participant.healthyEligiblePokemon()[i];
							if (newPoke.trainer === TheWild)
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
				throw "You've tried to start a battle when one is already in progress!";
		},
		begin : function () {
			battleContext.state = {
				kind : "running"
			};
			if (!battleContext.process) {
				Display.state.load(Display.state.save());
				var names = [], number = 0;
				if (battleContext.isWildBattle()) {
					var wildPokemon = TheWild.healthyEligiblePokemon();
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
					foreach(battleContext.opposingTrainers, function (trainer) {
						trainer.display.visible = true;
						names.push(trainer.fullname());
						++ number;
					});
					if (names.length === 1)
						Textbox.state(names.first() + " is challenging " + battleContext.alliedTrainers.first().pronoun() + " to a battle!");
					if (names.length > 1)
						Textbox.state(commaSeparatedList(names) + " are challenging " + battleContext.alliedTrainers.first().pronoun() + " to a battle!");
				}
			}
			battleContext.race(battleContext.queue);
			battleContext.queue = [];
			battleContext.startTurn();
		},
		finish : function () {
			battleContext.finished = true;
		},
		end : function (forcefully, flags) {
			if (battleContext.active) {
				battleContext.active = false;
				if (!battleContext.process && forcefully)
					Textbox.clear();
				if (!battleContext.process) Textbox.setStyle("standard");
				if (!battleContext.process)
					battleContext.draw();
				foreach(battleContext.all(true), function (poke) {
					if (poke.status === "badly poisoned")
						poke.status = "poisoned";
					poke.battler.reset();
				});
				battleContext.allies = [];
				battleContext.opponents = [];
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
				});
				if (!battleContext.process) {
					battleContext.handler = Keys.addHandler(function (key, pressed) {
						if (pressed && battleContext.state.kind === "evolution" && !["stopped", "finishing", "after"].contains(battleContext.state.stage) && Textbox.dialogue.empty()) {
							battleContext.state = {
								kind : "evolution",
								stage : "stopped",
								transition: 0,
								evolving : battleContext.state.evolving,
								into : battleContext.state.into
							};
							Textbox.state("...what? " + battleContext.state.evolving.name() + " has stopped evolving!", function () {
								battleContext.continueEvolutions();
							});
						}
					}, Settings._("keys => secondary"));
				}
				battleContext.continueEvolutions();
				var stored = [];
				foreach(battleContext.allTrainers(), function (trainer) {
					stored.push(trainer.store());
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
					battleContext.callback(arguments.length >= 2 ? flags : {
						"outcome" : "termination"
					}, stored);
				}
				battleContext.identifier = null;
			}
		},
		continueEvolutions : function () {
			if (battleContext.evolving.notEmpty()) {
				var evolver = battleContext.evolving.shift();
				battleContext.state = {
					kind : "evolution",
					stage : !battleContext.process ? "before" : "preparation",
					transition: 0,
					evolving : evolver.from,
					into : evolver.into
				};
				if (!battleContext.process) Textbox.state("What? " + evolver.from.name() + " is evolving!", function () {
					battleContext.state.stage = "preparation";
				});
			} else {
				if (!battleContext.process) {
					Keys.removeHandler(battleContext.handler);
					delete battleContext.handler;
				}
				battleContext.state = {
					kind : "inactive"
				};
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
						if (chosenActualMove.targets !== Move.targets.opposingSide && chosenActualMove.targets !== Move.targets.alliedSide) {
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
							who = Battles.side[(chosenActualMove.targets === Move.targets.opposingSide && ally) || (chosenActualMove.targets === Move.targets.alliedSide && !ally) ? "far" : "near"];
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
						if (arguments.length === 2) {
							var targets = Items._(character.bag.items[secondary].item).targets;
							if (targets === Move.targets.party) {
								targets = character.party.pokemon;
							} else if (targets === Move.targets.opponents) {
								targets = [];
								foreach(battleContext.opponents, function (opponent) {
									targets.push(opponent);
								});
								targets.reverse();
							}
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
							Textbox.state("All your Pokémon are already battling!");
							reprompt = true;
						}
					}  else {
						if (secondary >= character.pokemon()) {
							Textbox.state("There's no Pokémon in that slot!");
							advance = false;
						} else if (character.party.pokemon[secondary].health === 0) {
							Textbox.state("That Pokémon has fainted — you can't use that one!");
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
							currentBattler.battler.switching = true;
							battleContext.actions.push({
								poke : currentBattler,
								priority : 6,
								action : function (poke) {
									battleContext.swap(poke, character.party.pokemon[secondary]);
								}
							});
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
					character.megaEvolution = "intending";
					battleContext.actions.push({
						poke : currentBattler,
						priority : 5.9, // Technically 6, but should occur after switching
						action : function (poke) {
							poke.megaEvolve();
						},
						undo : function () {
							character.megaEvolution = "possible";
						}
					});
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
					battleContext.inputs.push(action);
					battleContext.advance();
				} else if (reprompt)
					battleContext.prompt();
			}
		},
		playerIsParticipating : function () {
			return !battleContext.process && Game.player !== null && Battle.alliedTrainers.contains(Game.player);
		},
		flushInputs : function () {
			// Sends any inputs the player has made since the inputs were last flushed, to the server
			// This is done after every set of inputs has been made at the start of the turn, and whenever extra input is required, such as when a Pokémon faints and the player has to decide which one to send out next
			if (battleContext.identifier !== null) {
				if (battleContext.inputs.notEmpty())
					Relay.pass("relay", battleContext.inputs, battleContext.identifier);
			}
			battleContext.inputs = [];
		},
		sync : function () {
			// Sends the current state of the battle to the server to make sure there haven't been any disruptions to the battle, especially of a... suspicious manner
			if (battleContext.identifier !== null) {
				var trainers = {};
				foreach(Battle.allTrainers(), function (trainer) {
					trainers[trainer.identification] = trainer.store();
				});
				Relay.pass("sync", {
					state : {
						turn : battleContext.turns,
						seed : battleContext.random.seed,
						weather : battleContext.weather,
						trainers : trainers
					}
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
				var waitForActions = function () {
					if (battleContext.hasCommunicationForTrainers("command"))
						battleContext.giveTrainersActions();
					else {
						battleContext.state = {
							"kind" : "waiting",
							"for" : "command"
						};
						if (!battleContext.process) Textbox.stateUntil("Waiting for " + (battleContext.playerIsParticipating() ? "the other player" : "both players") + " to make a decision...", function () { return battleContext.state.kind !== "waiting" && Textbox.dialogue.length > 1; });
					}
				};
				if (battleContext.process) waitForActions();
				else Textbox.effect(waitForActions);
			} else
				battleContext.prompt();
		},
		hasCommunicationForTrainers : function (kind, waitingActions) {
			var requiredActions = {};
			foreach(battleContext.allTrainers(), function (trainer) {
				if (trainer.type === Trainers.type.online) {
					var requiredActionsForTrainer = 0;
					if (kind === "command") {
						for (var i = 0; i < trainer.battlers().length; ++ i) {
							if (!battleContext.pokemonForcedIntoAction(trainer.battlers()[i], true)) {
								++ requiredActionsForTrainer;
							}
						}
					} else if (kind === "send") {
						var numberOfPokemonPerTrainer = battleContext.pokemonPerSide() / (battleContext.alliedTrainers.contains(trainer) ? battleContext.alliedTrainers : battleContext.opposingTrainers).length;
						if (trainer.battlers().length < numberOfPokemonPerTrainer)
							requiredActionsForTrainer = numberOfPokemonPerTrainer - trainer.battlers().length;
					}
					if (requiredActionsForTrainer)
						requiredActions[trainer.identification] = requiredActionsForTrainer;
				}
			});
			var actionsForTrainers = {};
			if (arguments.length < 2)
				waitingActions = battleContext.communication;
			foreach(waitingActions, function (communication) {
				if (!actionsForTrainers.hasOwnProperty(communication.trainer))
					actionsForTrainers[communication.trainer] = 0;
				++ actionsForTrainers[communication.trainer];
			});
			return !forevery(requiredActions, function (number, trainer) {
				if (!actionsForTrainers.hasOwnProperty(trainer) || actionsForTrainers[trainer] < number)
					return true;
			});
		},
		giveTrainersActions : function () {
			foreach(battleContext.allTrainers(), function (trainer) {
				if (trainer.isAnNPC())
					battleContext.AI.action(trainer);
				else if (trainer.type === Trainers.type.online) {
					for (var i = 0, action; i < trainer.battlers().length; ++ i) {
						if (!battleContext.pokemonForcedIntoAction(trainer.battlers()[i])) {
							action = null;
							foreach(battleContext.communication, function (communication, j) {
								if (communication.trainer === trainer.identification) {
									action = j;
									return true;
								}
							});
							if (action !== null) {
								action = battleContext.communication.remove(action);
								battleContext.input(action.primary, action.secondary, action.tertiary, trainer, i);
							}
						}
					}
				}
			});
			battleContext.queue = battleContext.queue.concat(battleContext.actions);
			battleContext.actions = [];
			if (battleContext.state.kind === "waiting") {
				battleContext.state = {
					kind : "running"
				};
				if (!battleContext.process) Textbox.update();
			}
			battleContext.processTurn();
		},
		receiveActions : function (actions) {
			// Receive the opponent's actions, in an online battle
			if (actions.notEmpty()) {
				battleContext.communication = battleContext.communication.concat(actions);
				if (battleContext.state.kind === "waiting") {
					if (battleContext.state.for === "command" && battleContext.hasCommunicationForTrainers("command"))
						battleContext.giveTrainersActions();
					else if (battleContext.state.for === "send" && battleContext.hasCommunicationForTrainers("send"))
						battleContext.continueToNextTurn(true);
				}
			}
		},
		changeWeather : function (weather) {
			battleContext.weather = weather;
			Weather.weather = battleContext.weather;
			Weather.time = 1;
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
		targetsForMove : function (user, move, excludeAlliesIfPossible) {
			// Returns an array of all the Pokémon that the user could target with the move
			if (move.targets !== Move.targets.opposingSide && move.targets !== Move.targets.alliedSide) {
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
					place : (move.targets === Move.targets.opposingSide && ally) || (move.targets === Move.targets.alliedSide && !ally) ? Battles.side.far : Battles.side.near
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
			if (poke.inBattle())
				return {
					side : poke.battler.side,
					team : poke.trainer.team,
					position : (poke.battler.side === Battles.side.near ? battleContext.allies : battleContext.opponents).indexOf(poke)
				};
			else
				return {
					team : poke.trainer.team,
					position : poke.trainer.party.pokemon.indexOf(poke)
				};
		},
		pokemonInPlace : function (place) {
			return (place.hasOwnProperty("side") ? (place.team === battleContext.alliedTrainers.first().team ? battleContext.allies : battleContext.opponents)[place.position] : battleContext.trainerOfTeam(place.team).party.pokemon[place.position]);
		},
		trainerOfTeam : function (team) {
			var trainerOfTeam = null, all = battleContext.allTrainers();
			foreach(all, function (trainer) {
				if (trainer.team === team) {
					trainerOfTeam = trainer;
					return true;
				}
			});
			return trainerOfTeam;
		},
		AI : {
			action : function (trainer) {
				// Decide whether to use a move, item, switch out, etc.
				foreach(trainer.battlers(), function (poke) {
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
		prompt : function () {
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
			}
			if (battleContext.pokemonPerSide() > 1) {
				currentBattler.battler.display.outlined = true;
				var display = Display.state.save();
				Textbox.effect(function () { Display.state.load(display); });
				currentBattler.battler.display.outlined = false;
			}
			var actions = [], hotkeys = {};
			if (!Widgets.isAvailable("Pokémon"))
				actions = ["Pokémon"].concat(actions);
			if (battleContext.rules.items === "allowed" && !Widgets.isAvailable("Bag"))
				actions.push("Bag");
			if (battleContext.isWildBattle()) {
				actions.push("Run");
				hotkeys[Settings._("keys => secondary")] = "Run";
			}
			var moves = [];
			foreach(currentBattler.usableMoves(), function (move) {
				moves.push(move.move);
			});
			if (battleContext.pokemonPerSide() > 1 && battleContext.selection > 0)
				actions.insert(2, "Back");
			if (currentBattler.potentialMegaEvolution() !== null)
				actions.insert(2, "Mega Evolve");
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
						context.fillRect(left * Game.zoom, top * Game.zoom, width * Game.zoom, height * Game.zoom);
						context.fillStyle = "white";
						context.textBaseline = "top";
						context.textAlign = "left";
						context.font = Font.load(24 * Game.zoom);
						context.fillText(move.move, (left + padding.horizontal) * Game.zoom, (top + padding.vertical) * Game.zoom);
						context.textAlign = "right";
						context.fillText(move.PP + "/" + Move.maximumPP(move.move, move.PPUps), (left + width - padding.horizontal) * Game.zoom, (top + padding.vertical) * Game.zoom);
						context.textAlign = "left";
						context.font = Font.load(18 * Game.zoom);
						context.fillText(stats.type, (left + padding.horizontal) * Game.zoom, (top + padding.vertical + 44) * Game.zoom);
						if (stats.hasOwnProperty("power"))
							context.fillText("Power: " + stats.power, (left + padding.horizontal) * Game.zoom, (top + padding.vertical + 70) * Game.zoom);
						context.textAlign = "right";
						context.fillText(stats.category === Move.category.physical ? "Physical" : stats.category === Move.category.special ? "Special" : stats.category === Move.category.status ? "Status" : "", (left + width - padding.horizontal) * Game.zoom, (top + padding.vertical + 44) * Game.zoom);
						if (stats.hasOwnProperty("accuracy"))
							context.fillText("Accuracy: " + Math.round(stats.accuracy * 100) + "%", (left + width - padding.horizontal) * Game.zoom, (top + padding.vertical + 70) * Game.zoom);
						context.textAlign = "left";
						context.font = Font.load(14 * Game.zoom);
						var lines = Textbox.wrap(stats.description, Textbox.newStyleContext(), [], (width - padding.horizontal * 2) * Game.zoom).split("\n");
						foreach(lines, function (line, i) {
							context.fillText(line, (left + padding.horizontal) * Game.zoom, (top + 128 + 16 * i) * Game.zoom);
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
			var all = battleContext.all(true)
			foreach(all, function (poke) {
				if (poke.battler.recharging) {
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
			foreach(battleContext.allTrainers(), function (trainer) {
				// If the trainer is still intending to Mega Evolve after last turn, it means they were unsuccessful, and they still have the chance to do it this turn
				if (trainer.megaEvolution === "intending")
					trainer.megaEvolution = "possible";
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
			battleContext.sync();
			if (!battleContext.delayForInput) {
				if (battleContext.playerIsParticipating())
					battleContext.prompt();
				else
					battleContext.advance();
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
			var all = battleContext.all(true)
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
					case Statuses.burn:
						if (!battleContext.process) Textbox.state(poke.name() + " is hurt by " + poke.possessivePronoun() + " burn!");
						battleContext.damage(poke, Move.percentageDamage(target, 1 / 8));
						break;
					case "poisoned":
						if (!battleContext.process) Textbox.state(poke.name() + " is hurt by the poison!");
						battleContext.damage(poke, Move.percentageDamage(target, 1 / 8));
						break;
					case "badly poisoned":
						if (!battleContext.process) Textbox.state(poke.name() + " is hurt by the toxic poison!");
						battleContext.damage(poke, Move.percentageDamage(target, poke.poison / 16));
						++ poke.poison;
						break;
				}
				if (poke.battler.recharging)
					++ poke.battler.recharging;
				if (poke.battler.protected)
					poke.battler.protected = false;
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
			switch (battleContext.weather) {
				case "intenseSunlight":
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
		fillEmptyPlaces : function (player) {
			var emptyPlaces = [];
			foreach(player ? battleContext.allies : battleContext.opponents, function (poke, i) {
				if (poke === NoPokemon)
					emptyPlaces.push(i);
			});
			if (player && battleContext.playerIsParticipating()) {
				var trainer = Game.player, progress = false;
				if (emptyPlaces.notEmpty()) {
					var healthyEligiblePokemon = trainer.healthyEligiblePokemon(true);
					if (healthyEligiblePokemon.length > emptyPlaces.length) {
						var names = [], positions = [];
						foreach(trainer.healthyEligiblePokemon(true), function (poke, i) {
							names.push(poke.name());
							positions.push(i);
						});
						if (names.empty()) {
							progress = true;
						} else {
							Textbox.ask("Which Pokémon do you want to send out?", names, function (response, i) {
								battleContext.inputs.push({
									action : "send",
									which : i
								});
								battleContext.enter(trainer.healthyEligiblePokemon(true)[i], true, emptyPlaces.first());
								battleContext.fillEmptyPlaces(true);
							}, null, null, null, null, null, true);
						}
					} else {
						foreach(healthyEligiblePokemon, function (poke) {
							battleContext.enter(poke, true, emptyPlaces.shift());
						});
						progress = true;
					}
				} else
					progress = true;
				if (progress) {
					battleContext.flushInputs();
					battleContext.fillEmptyPlaces(false); // Fill the opponent's empty places
				}
			} else {
				var anyQueries = false;
				// Queueing here is necessary so that the player can switch out their Pokémon before the opponent if the "switching chance" setting is on
				if (emptyPlaces.notEmpty()) { // If the opponent needs to send out a Pokémon
					if (battleContext.process === null || (!player && battleContext.opposingTrainers.length === 1 && battleContext.opposingTrainers.first().type === Trainers.type.NPC)) {
						foreach(battleContext.opposingTrainers, function (trainer) {
							if (!emptyPlaces.length)
								return true;
							var sendingOut = 0;
							while (trainer.battlers().length + sendingOut < Math.min(battleContext.pokemonPerSide() / battleContext.opposingTrainers.length) && trainer.hasHealthyEligiblePokemon(true) && emptyPlaces.length) {
								var poke = trainer.healthyEligiblePokemon(true).first(), immediatelyAfter;
								if (!battleContext.isCompetitiveBattle() && Settings._("switching chance")) {
									var character = Game.player;
									if (character.healthyEligiblePokemon(true).notEmpty()) {
										if (poke.trainer !== TheWild)
											Textbox.state(trainer.name + " is about to send out " + poke.name() + ".");
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
								var pressureSpeech = (trainer.healthyEligiblePokemon().length === 1 && trainer._("pressure speech?"));
								battleContext.queue.push({
									poke : poke,
									doesNotRequirePokemonToBeBattling : true,
									priority : 1,
									action : function (which) {return function () {
										battleContext.enter(which, true, emptyPlaces.shift());
										if (pressureSpeech) {
											Textbox.effect(function () {
												trainer.display.visible = true;
											}, battleContext.drawing.transition(poke.trainer.display.position, "x", -(battleContext.style === "double" ? 80 : 40), Settings._("switch transition duration") * Time.framerate));
											Textbox.spiel(trainer._("pressure speech"), null, battleContext.drawing.transition(poke.trainer.display.position, "x", -200, Settings._("switch transition duration") * Time.framerate), function () {
												trainer.display.visible = false;
											});
											Textbox.say("", 0); // Little hack to make sure the right textbox displays, not the next (menu) one
										}
									}; }(poke)
								});
								poke.battler.reserved = true;
								++ sendingOut;
							}
						});
					} else {
						var healthyEligiblePokemon = (!player ? battleContext.opposingTrainers : battleContext.alliedTrainers).first().healthyEligiblePokemon(true);
						if (healthyEligiblePokemon.length > emptyPlaces.length) {
							var waitForActions = function () {
								if (battleContext.hasCommunicationForTrainers("send")) {
									battleContext.continueToNextTurn(true);
								} else {
									battleContext.state = {
										"kind" : "waiting",
										"for" : "send"
									};
									if (!battleContext.process) Textbox.stateUntil("Waiting for " + (battleContext.playerIsParticipating() ? "the other player" : "both players") + " to make a decision...", function () { return battleContext.state.kind !== "waiting"; });
								}
							};
							if (battleContext.process) waitForActions();
							else Textbox.effect(waitForActions);
							anyQueries = true;
						} else {
							foreach(healthyEligiblePokemon, function (poke, which) {
								battleContext.enter(poke, true, emptyPlaces.shift());
							});
						}
					}
				}
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
				foreach(battleContext.allTrainers(), function (trainer) {
					if (trainer.type === Trainers.type.online) {
						var ally = battleContext.alliedTrainers.contains(trainer), numberOfPokemonPerTrainer = battleContext.pokemonPerSide() / (ally ? battleContext.alliedTrainers : battleContext.opposingTrainers).length;
						while (trainer.battlers().length < numberOfPokemonPerTrainer --) {
							var action = null;
							foreach(battleContext.communication, function (communication, j) {
								if (communication.trainer === trainer.identification) {
									action = j;
									return true;
								}
							});
							if (action !== null) {
								action = battleContext.communication.remove(action);
								battleContext.enter(trainer.healthyEligiblePokemon(true)[action.which], true, emptyPlaces[ally ? "near" : "far"].shift());
							} else break;
						}
					}
				});
			}
			battleContext.race(battleContext.queue);
			battleContext.queue = [];
			if (battleContext.state.kind === "waiting") {
				battleContext.state = {
					kind : "running"
				};
				if (!battleContext.process) Textbox.update();
			}
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
			amount = Math.floor(amount);
			if (!battleContext.process) {
				if (damage.critical && damage.effectiveness > 0)
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
						case 0:
							Textbox.state("It doesn't affect " + poke.name() + "!");
							return;
					}
				}
			}
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
			if (typeof damage.category !== "undefined" && damage.category !== null)
				poke.battler.damaged[damage.category] += amount;
			if (!battleContext.process) {
				var display = Display.state.save();
				Textbox.effect(function () { return Display.state.transition(display); });
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
						battleContext.end(false, {
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
			if (currentBattler.battler.isTrapped()) {
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
				if (escapeChance > 255 || randomInt(255) < escapeChance) {
					battleContext.queue.push({
						priority : 6,
						action : function () {
							var effect = function () {
								battleContext.end(false, {
									"outcome" : "escape"
								});
							};
							if (!battleContext.process) Textbox.state(battleContext.alliedTrainers[0].pronoun(true) + " escaped successfully!", effect);
							else effect();
							battleContext.finish();
						}
					});
				} else
					battleContext.queue.push({priority : 6, action : function () {
						if (!battleContext.process) Textbox.state(battleContext.alliedTrainers[0].pronoun(true) + " couldn't get away!");
					}});
			}
		},
		attemptCapture : function (poke, ball, trainer) {
			if (arguments.length < 3)
				trainer = Game.player;
			var OPower = trainer.OPowers["Capture"];
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
			if (trainer.dex.caught.length > 600) {
				modifiers.grass = 1;
				criticalCaptureChance *= 2.5;
			} else if (trainer.dex.caught.length > 450) {
				criticalCaptureChance *= 2;
				modifiers.grass = 3686/4096;
			} else if (trainer.dex.caught.length > 300) {
				criticalCaptureChance *= 1.5;
				modifiers.grass = 3277/4096;
			} else if (trainer.dex.caught.length > 150) {
				criticalCaptureChance *= 1;
				modifiers.grass = 2867/4096;
			} else if (trainer.dex.caught.length > 30) {
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
			if (modifiedCatchRate < 255) {
				for (var shakes = 0; shakes < (criticalCapture ? 1 : 4); ++ shakes) {
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
							Textbox.state((trainer === Game.player ? "Oh no! " : "") + "The Pokémon broke free!");
							break;
						case 1:
							Textbox.state((trainer === Game.player ? "Aww! " : "") + "It appeared to be caught!");
							break;
						case 2:
							Textbox.state((trainer === Game.player ? "Aargh! " : "") + "Almost had it!");
							break;
						case 3:
							Textbox.state((trainer === Game.player ? "Gah! " : "") + " It was so close, too!");
							break;
					}
				}
			} else {
				if (!battleContext.process) {
					poke.battler.display.transition = 0;
					var display = Display.state.save();
					Textbox.state((trainer === Game.player ? "Gotcha! " : "") + poke.name() + " was caught!", function () { return Display.state.transition(display); });
				}
				battleContext.removeFromBattle(poke, false);
				poke.caught.ball = ball;
				trainer.give(poke);
			}
			return caught;
		},
		removeFromBattle : function (poke, drawnBattle) {
			// Stops a Pokémon battling, either because they've fainted, or because they've been caught in a Poké ball
			if (!battleContext.isCompetitiveBattle()) {
				foreach(poke.battler.opponents, function (gainer) {
					if (!gainer.fainted()) {
						if (gainer.gainExperience(poke, poke.battler.opponents.length, true)) // If a level was gained
							battleContext.levelUppers.pushIfNotAlreadyContained(gainer);
					}
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
			if (!poke.trainer.hasHealthyEligiblePokemon(false, poke)) {
				var playerHasBeenDefeated = (poke.trainer === battleContext.alliedTrainers.first()), trainerBattle = !battleContext.isWildBattle(), playerName = !battleContext.process ? battleContext.alliedTrainers.first().pronoun(true) : null, endbattleContextFlags;
				if (trainerBattle) {
					var opponents = [];
					foreach(battleContext.opposingTrainers, function (opposer) {
						opponents.push(opposer.fullname());
					});
				}
				if (!drawnBattle) {
					if (playerHasBeenDefeated) {
						if (!battleContext.process) {
							if (trainerBattle)
								Textbox.state(opponents + " " + (opponents.length !== 1 ? "have" : "has") + " defeated " + playerName + "!");
							else
								Textbox.state(playerName + " " + (poke.trainer === Game.player ? "have" : "has") + " been defeated by the wild Pokémon!");
						}
						if (!battleContext.isCompetitiveBattle()) {
							var highestLevel = 0;
							foreach(poke.trainer.party.pokemon, function (pkmn) {
								if (pkmn.level > highestLevel)
									highestLevel = pkmn.level;
							});
							var basePayout;
							switch (Math.min(8, poke.trainer.badges.length)) { // May have greater than 8 badges due to multiple regions
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
							if (poke.trainer.money > 0) {
								priceOfDefeat = Math.min(priceOfDefeat, poke.trainer.money);
								if (!battleContext.process) Textbox.state(playerName + " " + (trainerBattle ? "paid out" : "dropped") + " $" + priceOfDefeat + " " + (trainerBattle ? "to " + commaSeparatedList(opponents) : "in " + poke.trainer.possessiveGenderPronoun() + " panic to get away") + ".");
								battleContext.alliedTrainers.first().money -= priceOfDefeat;
							} else if (trainerBattle) {
								if (!battleContext.process) Textbox.state(playerName + " didn't have any money to pay " + opponents + "!");
							}
							if (!battleContext.alliedTrainers.first().hasHealthyPokemon()) // Not necessarily true for Sky Battles
								if (!battleContext.process) Textbox.state(playerName + " blacked out!");
						}
						endbattleContextFlags = {
							"outcome" : "opposing victory"
						};
					} else {
						if (!battleContext.process) Textbox.state(playerName + " " + (battleContext.alliedTrainers.first() !== Game.player ? "has" : "have") + " defeated " + (trainerBattle ? opponents : "the wild Pokémon") + "!");
						if (trainerBattle) {
							if (!battleContext.process) {
								foreach(battleContext.opposingTrainers, function (opposer, i) {
									Textbox.effect(function () {
										poke.trainer.display.visible = true;
									}, battleContext.drawing.transition(poke.trainer.display.position, "x", 0, Settings._("switch transition duration") * Time.framerate));
									Textbox.spiel(opposer._("defeat speech"));
									if (i !== battleContext.opposingTrainers.length - 1) {
										Textbox.effect(null, battleContext.drawing.transition(poke.trainer.display.position, "x", -200, Settings._("switch transition duration") * Time.framerate), function () {
											poke.trainer.display.visible = false;
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
						endbattleContextFlags = {
							"outcome" : "allied victory"
						};
					}
					var effect = function () {
						battleContext.end(false, endbattleContextFlags);
					};
					if (!battleContext.process) Textbox.effect(effect);
					else effect();
					battleContext.finish();
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
				if (poke.trainer !== TheWild) {
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
				if (poke.trainer !== TheWild)
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
				foreach(Stats, function (stat) {
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
			battleContext.recoverFromStatus(poke);
		},
		withdraw : function (poke, forced) {
			if (!battleContext.process) {
				poke.battler.display.transition = 0;
				var display = Display.state.save(), place;
			}
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
			foreach(entrants, function (racer) {
				if (!battleContext.active || battleContext.finished)
					return true;
				if (racer.hasOwnProperty("poke") && (!racer.poke.battler.battling && !racer.doesNotRequirePokemonToBeBattling))
					return;
				if (action)
					action(racer.poke);
				else
					racer.action(racer.poke);
				battleContext.survey();
			});
		},
		triggerEvent : function (event, data, cause, subjects) {
			if (arguments.length < 4)
				subjects = battleContext.all(true);
			subjects = wrapArray(subjects);
			var responses = [];
			foreach(subjects, function (poke) {
				responses = responses.concat(poke.respondToEvent(event, data, cause));
				data.oneself = (cause === poke);
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
						if (!battleContext.process) Textbox.state(target.name() + " broke out of " + target.possessivePronoun() + " confusion!");
						target.battler.confused = false;
					}, battleContext.random.int(1, 4), poke);
				}
			}
		},
		infatuate : function (poke) {
			if (!poke.fainted()) {
				if (poke.battler.infatuated) {
					if (!battleContext.process) Textbox.state(poke.name() + " is already infatuated!");
				} else {
					if (!battleContext.process) Textbox.state(poke.name() + " has become infatuated!");
					poke.battler.infatuated = true;
					battleContext.haveEffect(function (target) {
						if (!battleContext.process) Textbox.state(target.name() + " broke out of " + target.possessivePronoun() + " infatuation!");
						target.battler.infatuated = false;
					}, battleContext.random.int(1, 4), poke);
				}
			}
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
		inflict : function (poke, status, force) {
			var types = poke.currentProperty(types);
			if ((poke.status === "none" || force) && (status !== "burned" || !types.contains("Fire")) && (status !== "paralysed" || !types.contains("Electric")) && (status !== "frozen" || !types.contains("Ice")) && ((status !== "poisoned" && status !== "badly poisoned") || (!types.contains("Poison") && !types.contains("Steel")))) {
				if (!poke.fainted()) {
					if (!battleContext.process) Textbox.state(poke.name() + " was " + (status !== "asleep" ? status : "put to sleep") + "!");
					poke.status = status;
					battleContext.recoverFromStatus(poke);
				}
				return true;
			} else {
				if (!poke.fainted() && !battleContext.process) {
					Textbox.state("But " + poke.name() + " was not " + status + "!");
				}
				return false;
			}
		},
		recoverFromStatus : function (poke) {
			if (poke.status === "asleep") {
				battleContext.haveEffect(function (target) {
					if (!battleContext.process) Textbox.state(target.name() + " woke up!");
					target.status = "none";
				}, battleContext.random.int(1, 5), poke);
			}
			if (poke.status === "frozen") {
				battleContext.haveEffect(function (target) {
					if (!battleContext.process) Textbox.state(target.name() + " thawed!");
					target.status = "none";
				}, battleContext.random.int(1, 5), poke);
			}
		},
		isWildBattle : function () {
			return battleContext.opposingTrainers.length === 1 && battleContext.opposingTrainers.first() === TheWild;
		},
		isCompetitiveBattle : function () {
			return battleContext.flags.contains("competitive");
		}
	}, visual);
	
	return battleContext;
}
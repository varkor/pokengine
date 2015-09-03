Widgets = {};

Widgets.FlowGrid = {
	templates : {
		pokemon : FlowCellTemplate({
			size : {
				width : 80,
				height : 80
			},
			draw : function (context, poke, position, size, states) {
				var lightness = 25;
				for (var i = 0; i < states.length; ++ i) {
					switch (states[i]) {
						case "hover":
							if (Widgets.Party.state.kind === "overworld") {
								lightness += 5;
							}
							break;
					}
				}
				context.fillStyle = "hsl(0, 0%, " + lightness + "%)";
				context.fillRoundedRectHD(Math.round(position.x), Math.round(position.y), size.width, size.height, 4);
				context.fillStyle = "hsl(0, 0%, 60%)";
				context.textAlign = "center";
				// Name
				context.textBaseline = "bottom";
				context.setFontHD("Arial", 10);
				context.fillTextHD(poke.name(), position.x + size.width / 2, position.y + size.height - 4);
				// Level
				context.textBaseline = "top";
				context.setFontHD("Arial", 8);
				context.fillTextHD("Lv. " + poke.level, position.x + size.width / 2, position.y + 4);
				// Health
				var radius, startAngle = 3 / 4 * Math.PI, endAngle;
				var percentageHealth = poke.health / poke.maximumHealth();
				radius = { outer : 22, inner : 19 };
				endAngle = startAngle + percentageHealth * 2 * Math.PI;
				context.fillStyle = (percentageHealth > 0.5 ? "hsl(110, 100%, 40%)" : percentageHealth > 0.2 ? "hsl(40, 100%, 50%)" : "hsl(0, 100%, 50%)");
				context.beginPath();
				context.arcHD(position.x + size.width / 2, position.y + size.height / 2, radius.inner, 2 * Math.PI - startAngle, 2 * Math.PI - endAngle, true);
				context.arcHD(position.x + size.width / 2, position.y + size.height / 2, radius.outer, 2 * Math.PI - endAngle, 2 * Math.PI - startAngle, false);
				context.fill();
				// Experience
				var percentageExperience = poke.experience / poke.experienceFromLevelToNextLevel();
				radius = { outer : 17, inner : 15 };
				endAngle = startAngle + percentageExperience * 2 * Math.PI;
				context.fillStyle = poke.health > 0 ? "hsl(190, 100%, 50%)" : "hsl(190, 0%, 50%)";
				context.beginPath();
				context.arcHD(position.x + size.width / 2, position.y + size.height / 2, radius.inner, 2 * Math.PI - startAngle, 2 * Math.PI - endAngle, true);
				context.arcHD(position.x + size.width / 2, position.y + size.height / 2, radius.outer, 2 * Math.PI - endAngle, 2 * Math.PI - startAngle, false);
				context.fill();
				// Icon
				var icon = Sprite.load(poke.paths.icon(true));
				if (icon) {
					context.imageSmoothingEnabled = false;
					context.copyImageHD(icon.image, false, true, position.x + (size.width - icon.width) / 2, position.y + (size.height - icon.height) / 2);
					context.imageSmoothingEnabled = true;
				} else {
					Sprite.load(poke.paths.icon(true), function () {
						if (Widgets.Party.interface.cells.indexOf(poke) !== -1) {
							Widgets.Party.interface.redrawCell(poke);
						}
					});
				}
				// Send-out banner
				var clickedPoke = Display.original(poke);
				if (Widgets.Party.state.kind === "switch" && states.contains("hover") && clickedPoke.trainer.healthyEligiblePokemon(true).contains(clickedPoke)) {
					var bannerHeight = 32;
					context.fillStyle = "hsl(0, 60%, 40%)";
					context.fillRectHD(position.x, position.y + (size.height - bannerHeight) / 2, size.width, bannerHeight);
					context.fillStyle = "hsl(0, 0%, 100%)";
					context.textBaseline = "middle";
					context.setFontHD("Arial", 12);
					context.fillTextHD("Send out", position.x + size.width / 2, position.y + size.height / 2);
				}
			}
		}),
		tinyPokemon : FlowCellTemplate({
			size : {
				width : 38,
				height : 38
			},
			draw : function (context, poke, position, size, states) {
				var lightness = 25;
				for (var i = 0; i < states.length; ++ i) {
					switch (states[i]) {
						case "hover":
							if (Widgets.Party.state.kind === "overworld") {
								lightness += 5;
							}
							break;
					}
				}
				context.fillStyle = "hsl(0, 0%, " + lightness + "%)";
				context.fillRoundedRectHD(Math.round(position.x), Math.round(position.y), size.width, size.height, 4);
				// Send-out banner
				var clickedPoke = Display.original(poke);
				if (Widgets.Party.state.kind === "switch" && states.contains("hover") && clickedPoke.trainer.healthyEligiblePokemon(true).contains(clickedPoke)) {
					var bannerHeight = 32;
					context.fillStyle = "hsl(0, 60%, 40%)";
					context.fillRoundedRectHD(Math.round(position.x), Math.round(position.y), size.width, size.height, 4);
					context.fillStyle = "hsl(0, 0%, 100%)";
					context.textAlign = "center";
					context.textBaseline = "bottom";
					context.setFontHD("Arial", 8);
					context.fillTextHD("Send", position.x + size.width / 2, position.y + size.height - 2);
				} else {
					// Health
					var percentageHealth = poke.health / poke.maximumHealth();
					context.fillStyle = (percentageHealth > 0.5 ? "hsl(110, 100%, 40%)" : percentageHealth > 0.2 ? "hsl(40, 100%, 50%)" : "hsl(0, 100%, 50%)");
					context.fillRoundedRectHD(position.x + 3, position.y + size.height - 6, (percentageHealth * size.width - 6), 2, 1);
				}
				// Icon
				var icon = Sprite.load(poke.paths.icon(true));
				if (icon) {
					context.imageSmoothingEnabled = false;
					context.copyImageHD(icon.image, false, true, position.x + (size.width - icon.width) / 2, position.y + (size.height - icon.height) / 2 - 2);
					context.imageSmoothingEnabled = true;
				} else {
					Sprite.load(poke.paths.icon(true), function () {
						if (Widgets.Party.interface.cells.indexOf(poke) !== -1) {
							Widgets.Party.interface.redrawCell(poke);
						}
					});
				}
			}
		})
	}
};

Widgets.Party = {
	state : {
		kind : "overworld"
	},
	switchSize : function (maximise) {
		var flowGrid = Widgets.Party.interface;
		if (maximise) {
			flowGrid.template = Widgets.FlowGrid.templates.pokemon;
			flowGrid.rows = 2;
			flowGrid.columns = 3;
			flowGrid.margin = {
				left : 8,
				right : 8,
				top : 8,
				bottom : 8
			};
			flowGrid.spacing = {
				x : 8,
				y : 8
			};
		} else {
			flowGrid.template = Widgets.FlowGrid.templates.tinyPokemon;
			flowGrid.rows = 1;
			flowGrid.columns = 6;
			flowGrid.margin = {
				left : 4,
				right : 4,
				top : 4,
				bottom : 4
			};
			flowGrid.spacing = {
				x : 4,
				y : 4
			};
		}
		flowGrid.size = {
			width : flowGrid.columns * flowGrid.template.size.width + (flowGrid.columns - 1) * flowGrid.spacing.x + flowGrid.margin.left + flowGrid.margin.right,
			height : flowGrid.rows * flowGrid.template.size.height + (flowGrid.rows - 1) * flowGrid.spacing.y + flowGrid.margin.top + flowGrid.margin.bottom,
		};
		flowGrid.canvas.width = flowGrid.size.width * window.devicePixelRatio;
		flowGrid.canvas.height = flowGrid.size.height * window.devicePixelRatio;
		flowGrid.canvas.style.width = flowGrid.size.width + "px";
		flowGrid.canvas.style.height = flowGrid.size.height + "px";
		flowGrid.refreshDataFromSource();
	},
	interface : FlowGrid({
		template : Widgets.FlowGrid.templates.tinyPokemon,
		datasource : [],
		rows : 1,
		columns : 6,
		contrainToBounds : true,
		selection : "none",
		margin : {
			x : 4,
			y : 4
		},
		spacing : {
			x : 4,
			y : 4
		},
		events : {
			"cell:click" : function (index, poke) {
				var clickedPoke = Display.original(poke);
				if (Widgets.Party.state.kind === "switch" && clickedPoke.trainer.healthyEligiblePokemon(true).contains(clickedPoke)) {
					Widgets.Party.state.callback(index);
				}
			},
			"cells:drop" : function (index, cells) {
				var fromIndex = cells[0].index;
			}
		},
		draw : function (context, size, region) {
			context.fillStyle = "hsl(0, 0%, 20%)";
			context.fillRoundedRectHD(region.origin.x, region.origin.y, region.size.width, region.size.height, 4);
		}
	}),
	// BattleContext delegate methods
	BattleContextDelegate : {
		battleIsBeginning : function (battle) {
			Widgets.Party.state.kind = "battle";
			Widgets.Party.interface.lock();
		},
		battleIsEnding : function (battle) {
			Widgets.Party.state.kind = "overworld";
			Widgets.Party.interface.unlock();
		},
		shouldDisplayMenuOption : function (battle) {
			return false;
		},
		allowPlayerToSwitchPokemon : function (battle, callback) {
			Widgets.Party.state = {
				kind : "switch",
				callback : callback
			};
			Widgets.Party.interface.unlock(["hover"]);
		},
		disallowPlayerToSwitchPokemon : function (battle) {
			Widgets.Party.state.kind = "battle";
			Widgets.Party.interface.lock(["hover"]);
		},
		pokemonHaveUpdated : function (pokes) {
			// Note this is usually *not* the actual player's Pokémon, but stored Pokémon from the Display object
			Widgets.Party.interface.refreshDataFromSource(pokes);
		}
	}
};
BattleContext.defaultDelegates.Pokémon = Widgets.Party.BattleContextDelegate;
"use strict";

const Widgets = {};

Widgets.FlowGrid = {
	templates : {
		pokemon : FlowCellTemplate({
			size : {
				width : 80,
				height : 80
			},
			interacts : [],
			draw (context, poke, position, size, states, interacting) {
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
				var interactable = false;
				if (states.contains("interact") && Widgets.Bag.state.kind === "use") {
					var originalBag = Display.original(interacting.trainer).bag, interactedPoke = Display.original(poke), targets = interactedPoke.trainer.battle.targetsForItem(interactedPoke.trainer, Items._(interacting.item));
					if (originalBag.usableItems(true).contains(Display.original(interacting)) && targets.contains(interactedPoke)) {
						interactable = true;
						lightness += 5;
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
				// Status
				if (poke.status !== "none") {
					var offset = 2, cornerRadius = 4;
					context.beginPath();
					context.lineToHD(position.x, position.y + size.height / 4);
					for (var angle = 0; angle <= 1; angle += 1 / 8) {
						context.lineToHD(
							position.x + size.width / 2 + (size.width / 2 - cornerRadius) * Math.sign(Math.cos((offset + 0.5) * Math.PI / 2)) + cornerRadius * Math.cos((angle + offset) * Math.PI / 2),
							position.y + size.height / 2 + (size.height / 2 - cornerRadius) * Math.sign(Math.sin((offset + 0.5) * Math.PI / 2)) + cornerRadius * Math.sin((angle + offset) * Math.PI / 2)
						);
					}
					context.lineToHD(position.x + size.width / 4, position.y);
					context.fillStyle = "hsl(" + ["0, 50%, 50%", "185, 50%, 70%", "55, 70%, 50%", "280, 50%, 50%", "265, 70%, 50%", "0, 0%, 70%"][["burned", "frozen", "paralysed", "poisoned", "badly poisoned", "asleep"].indexOf(poke.status)] + ")";
					context.fill();
				}
				// Icon
				var redrawOnceLoaded = path => {
					Sprite.load(path, function () {
						if (Widgets.Party.interface.cells.indexOf(poke) !== -1) {
							Widgets.Party.interface.redrawCell(poke);
						}
					});
				};
				var icon;
				icon = Sprite.load(poke.paths.icon(true));
				if (icon) {
					context.imageSmoothingEnabled = false;
					context.copyImageHD(icon.image, false, true, position.x + (size.width - icon.width) / 2, position.y + (size.height - icon.height) / 2);
					context.imageSmoothingEnabled = true;
				} else {
					redrawOnceLoaded(poke.paths.icon(true));
				}
				// Item
				if (poke.item !== null) {
					var item = Items._(poke.item);
					icon = Sprite.load(item.paths.icon(true));
					if (icon) {
						context.copyImageHD(icon.image, false, true, position.x + (size.width - icon.width / 2) / 2 + 8, position.y + (size.height - icon.height / 2) / 2 + 8, icon.width / 2, icon.height / 2);
					} else {
						redrawOnceLoaded(item.paths.icon(true));
					}
				}
				var drawBanner = text => {
					var bannerHeight = 32;
					context.fillStyle = "hsl(0, 60%, 40%)";
					context.fillRectHD(position.x, position.y + (size.height - bannerHeight) / 2, size.width, bannerHeight);
					context.fillStyle = "hsl(0, 0%, 100%)";
					context.textBaseline = "middle";
					context.setFontHD("Arial", 12);
					context.fillTextHD(text, position.x + size.width / 2, position.y + size.height / 2);
				};
				// Send-out banner
				var hoveredPoke = Display.original(poke);
				if (Widgets.Party.state.kind === "switch" && states.contains("hover") && hoveredPoke.trainer.healthyEligiblePokemon(true).contains(hoveredPoke)) {
					drawBanner("Send out");
				}
				// Item interaction
				if (interactable) {
					drawBanner("Use");
				}
			}
		}),
		tinyPokemon : FlowCellTemplate({
			size : {
				width : 38,
				height : 38
			},
			interacts : [],
			draw (context, poke, position, size, states, interacting) {
				var lightness = 25;
				var interactable = false;
				if (states.contains("interact") && Widgets.Bag.state.kind === "use") {
					var originalBag = Display.original(interacting.trainer).bag, interactedPoke = Display.original(poke), targets = interactedPoke.trainer.battle.targetsForItem(interactedPoke.trainer, Items._(interacting.item));
					if (originalBag.usableItems(true).contains(Display.original(interacting)) && targets.contains(interactedPoke)) {
						interactable = true;
						lightness += 5;
					}
				}
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
				var drawBanner = (text) => {
					var bannerHeight = 32;
					context.fillStyle = "hsl(0, 60%, 40%)";
					context.fillRoundedRectHD(Math.round(position.x), Math.round(position.y), size.width, size.height, 4);
					context.fillStyle = "hsl(0, 0%, 100%)";
					context.textAlign = "center";
					context.textBaseline = "bottom";
					context.setFontHD("Arial", 8);
					context.fillTextHD(text, position.x + size.width / 2, position.y + size.height - 2);
				};
				// Send-out banner
				var clickedPoke = Display.original(poke);
				if (Widgets.Party.state.kind === "switch" && states.contains("hover") && clickedPoke.trainer.healthyEligiblePokemon(true).contains(clickedPoke)) {
					drawBanner("Send");
				} else if (interactable) {
					drawBanner("Use");
				} else {
					// Health
					var percentageHealth = poke.health / poke.maximumHealth();
					context.fillStyle = (percentageHealth > 0.5 ? "hsl(110, 100%, 40%)" : percentageHealth > 0.2 ? "hsl(40, 100%, 50%)" : "hsl(0, 100%, 50%)");
					context.fillRoundedRectHD(position.x + 3, position.y + size.height - 6, percentageHealth * (size.width - 6), 2, 1);
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
		}),
		item : FlowCellTemplate({
			size : {
				width : 46,
				height : 46
			},
			interacts : [],
			draw (context, data, position, size, states) {
				var lightness = 25;
				for (var i = 0; i < states.length; ++ i) {
					switch (states[i]) {
						case "drag":
							lightness += 25;
							break;
						case "select":
							lightness += 15;
							break;
						case "hover":
							lightness += 5;
							break;
					}
				}
				if (!states.contains("drag")) {
					context.fillStyle = "hsl(0, 0%, " + lightness + "%)";
					context.fillRoundedRectHD(Math.round(position.x), Math.round(position.y), size.width, size.height, 4);
				}
				// Icon
				var item = Items._(data.item);
				var icon = Sprite.load(item.paths.icon(true));
				if (icon) {
					context.imageSmoothingEnabled = false;
					context.copyImageHD(icon.image, false, true, position.x + (size.width - icon.width) / 2, position.y + (size.height - icon.height) / 2 - 2);
					context.imageSmoothingEnabled = true;
				} else {
					Sprite.load(item.paths.icon(true), function () {
						if (Widgets.Bag.interface.cells.indexOf(data) !== -1) {
							Widgets.Bag.interface.redrawCell(data);
						}
					});
				}
				// Name
				if (states.contains("hover")) {
					context.textAlign = "center";
					context.textBaseline = "bottom";
					context.setFontHD("Arial", 6);
					context.fillStyle = "hsl(0, 0%, " + (lightness + 65) + "%)";
					context.fillTextHD(item.fullname, position.x + size.width / 2, position.y + size.height - 2);
				}
				// Quantity
				if (data.quantity !== 1) {
					context.beginPath();
					context.moveToHD(position.x + size.width / 2, position.y);
					for (var angle = 0, offset = 3, cornerRadius = 4; angle <= 1; angle += 1 / 8) {
						context.lineToHD(
							position.x + size.width / 2 + (size.width / 2 - cornerRadius) * Math.sign(Math.cos((offset + 0.5) * Math.PI / 2)) + cornerRadius * Math.cos((angle + offset) * Math.PI / 2),
							position.y + size.height / 2 + (size.height / 2 - cornerRadius) * Math.sign(Math.sin((offset + 0.5) * Math.PI / 2)) + cornerRadius * Math.sin((angle + offset) * Math.PI / 2)
						);
					}
					context.lineToHD(position.x + size.width, position.y + size.height / 2);
					context.fillStyle = "hsl(0, 0%, " + (lightness + 20) + "%)";
					context.fill();
					context.save();
					context.translateHD(position.x + 3 * size.width / 4, position.y + size.height / 4);
					context.rotate(Math.PI / 4);
					context.fillStyle = "hsl(0, 0%, " + (lightness - 25) + "%)";
					context.textAlign = "center";
					context.textBaseline = "bottom";
					context.setFontHD("Arial", 10);
					context.fillTextHD(data.quantity < 100 ? data.quantity : "99+", 0, 0);
					context.restore();
				}
				// Use banner
				if (Widgets.Bag.state.kind === "use" && states.contains("hover") && Display.original(data.trainer).bag.usableItems(true).contains(Display.original(data))) {
					var bannerHeight = 20;
					context.fillStyle = "hsl(0, 60%, 40%)";
					context.fillRectHD(position.x, position.y + (size.height - bannerHeight) / 2, size.width, bannerHeight);
					context.fillStyle = "hsl(0, 0%, 100%)";
					context.textBaseline = "middle";
					context.setFontHD("Arial", 12);
					context.fillTextHD("Use", position.x + size.width / 2, position.y + size.height / 2);
				}
			}
		})
	}
};
Widgets.FlowGrid.templates.pokemon.interacts = Widgets.FlowGrid.templates.tinyPokemon.interacts = [{
	template : Widgets.FlowGrid.templates.item,
	cardinality : "single"
}];

Widgets.Party = {
	state : {
		kind : "overworld"
	},
	switchSize (maximise) {
		var flowGrid = Widgets.Party.interface;
		if (maximise) {
			flowGrid.template = Widgets.FlowGrid.templates.pokemon;
			flowGrid.rows = 2;
			flowGrid.columns = 3;
			flowGrid.margin = {
				left : 6,
				right : 6,
				top : 6,
				bottom : 6
			};
			flowGrid.spacing = {
				x : 6,
				y : 6
			};
		} else {
			flowGrid.template = Widgets.FlowGrid.templates.tinyPokemon;
			flowGrid.rows = 1;
			flowGrid.columns = 6;
			flowGrid.margin = {
				left : 5,
				right : 5,
				top : 5,
				bottom : 5
			};
			flowGrid.spacing = {
				x : 5,
				y : 5
			};
		}
		flowGrid.size = {
			width : flowGrid.columns * flowGrid.template.size.width + (flowGrid.columns - 1) * flowGrid.spacing.x + flowGrid.margin.left + flowGrid.margin.right,
			height : flowGrid.rows * flowGrid.template.size.height + (flowGrid.rows - 1) * flowGrid.spacing.y + flowGrid.margin.top + flowGrid.margin.bottom
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
		columns : 1,
		contrainToBounds : true,
		selection : "none",
		margin : 0,
		spacing : 0,
		listeners : {
			"cell:click" (index, poke) {
				if (Widgets.Party.state.kind === "switch") {
					var clickedPoke = Display.original(poke);
					if (clickedPoke.trainer.healthyEligiblePokemon(true).contains(clickedPoke)) {
						Widgets.Party.state.callback(index);
					}
				}
			},
			"cell:interact" (index, poke, data) {
				if (Widgets.Bag.state.kind === "use") {
					var originalBag = Display.original(data.trainer).bag, interactedPoke = Display.original(poke), targets = interactedPoke.trainer.battle.targetsForItem(interactedPoke.trainer, Items._(data.item));
					if (originalBag.usableItems(true).contains(Display.original(data)) && targets.contains(interactedPoke)) {
						Widgets.Bag.state.callback(originalBag.indexOfItem(data.item), interactedPoke.trainer.battle.placeOfPokemon(interactedPoke));
					}
				}
			}
		},
		draw (context, size, region) {
			var padding = 0;
			if (Widgets.Party && Widgets.Party.state.kind === "switch" && size.width === region.size.width && size.height === region.size.height) {
				padding = 1;
				context.fillStyle = "hsl(190, 100%, 50%)";
				context.fillRoundedRectHD(region.origin.x, region.origin.y, region.size.width, region.size.height, 4);
			}
			context.fillStyle = "hsl(0, 0%, 20%)";
			context.fillRoundedRectHD(region.origin.x + padding, region.origin.y + padding, region.size.width - 2 * padding, region.size.height - 2 * padding, 4);
		}
	}),
	// BattleContext delegate methods
	BattleContextDelegate : {
		battleIsBeginning (battle) {
			Widgets.Party.state.kind = "battle";
			Widgets.Party.interface.lock();
		},
		battleIsEnding (battle) {
			Widgets.Party.state.kind = "overworld";
			Widgets.Party.interface.unlock();
		},
		shouldDisplayMenuOption : (battle) => false,
		allowPlayerToSwitchPokemon (battle, callback) {
			Widgets.Party.state = {
				kind : "switch",
				callback : callback
			};
			Widgets.Party.interface.unlock(["hover"]);
			Widgets.Party.interface.refreshDataFromSource();
		},
		disallowPlayerToSwitchPokemon (battle) {
			Widgets.Party.state.kind = "battle";
			Widgets.Party.interface.lock(["hover"]);
			Widgets.Party.interface.refreshDataFromSource();
		},
		pokemonHaveUpdated (pokes) {
			// Note this is usually *not* the actual player's Pokémon, but stored Pokémon from the Display object
			Widgets.Party.interface.refreshDataFromSource(pokes);
		}
	}
};
Widgets.Party.switchSize(true);
BattleContext.defaultDelegates.Pokémon = Widgets.Party.BattleContextDelegate;

Widgets.Bag = {
	state : {
		kind : "overworld"
	},
	interface : FlowGrid({
		template : Widgets.FlowGrid.templates.item,
		datasource : [],
		rows : 3,
		columns : 5,
		contrainToBounds : false,
		selection : "multiple",
		margin : 5,
		spacing : 6,
		listeners : {
			"cell:click" (index, data) {
				if (Widgets.Bag.state.kind === "use") {
					var originalBag = Display.original(data.trainer).bag;
					if (originalBag.usableItems(true).contains(Display.original(data))) {
						Widgets.Bag.state.callback(originalBag.indexOfItem(data.item));
					}
				} 
			},
			"cell:drag" (index, cells) {
				if (Widgets.Bag.state.kind === "overworld") {
					return false;
				}
				if (Widgets.Bag.state.kind !== "use") {
					return true;
				}
				return foreach(cells, cell => {
					var originalBag = Display.original(cell.data.trainer).bag;
					if (!originalBag.usableItems(true).contains(Display.original(cell.data))) {
						return true; // Block the drag one of the item cannot be used
					}
				});
			}
		},
		draw (context, size, region) {
			var padding = 0;
			if (Widgets.Bag && Widgets.Bag.state.kind === "use" && size.width === region.size.width && size.height === region.size.height) {
				padding = 1;
				context.fillStyle = "hsl(190, 100%, 50%)";
				context.fillRoundedRectHD(region.origin.x, region.origin.y, region.size.width, region.size.height, 4);
			}
			context.fillStyle = "hsl(0, 0%, 20%)";
			context.fillRoundedRectHD(region.origin.x + padding, region.origin.y + padding, region.size.width - 2 * padding, region.size.height - 2 * padding, 4);
		}
	}),
	// BattleContext delegate methods
	BattleContextDelegate : {
		battleIsBeginning (battle) {
			Widgets.Bag.state.kind = "battle";
			Widgets.Bag.interface.lock();
			Widgets.Bag.interface.deselectAll();
		},
		battleIsEnding (battle) {
			Widgets.Bag.state.kind = "overworld";
			Widgets.Bag.interface.unlock();
		},
		shouldDisplayMenuOption : (battle) => false,
		allowPlayerToUseItem (battle, callback) {
			Widgets.Bag.state = {
				kind : "use",
				callback : callback
			};
			Widgets.Bag.interface.unlock(["hover", "drag"]);
			Widgets.Bag.interface.refreshDataFromSource();
		},
		disallowPlayerToUseItem (battle) {
			Widgets.Bag.state.kind = "battle";
			Widgets.Bag.interface.lock(["hover", "drag"]);
			Widgets.Bag.interface.refreshDataFromSource();
		},
		itemsHaveUpdated(items) {
			Widgets.Bag.interface.refreshDataFromSource(items);
		}
	}
};
BattleContext.defaultDelegates.Bag = Widgets.Bag.BattleContextDelegate;
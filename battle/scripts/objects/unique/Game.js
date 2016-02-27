"use strict";

let Game = {
	zoom : 1,
	focused : true,
	increment : 0,
	unique : function () {
		// Returns a unique id that can be used to identify different objects
		return Game.increment ++;
	},
	player : null,
	location : "Route 1 (Kanto)",
	takePossessionOf : function (entity) {
		Game.player = entity;
		entity.type = Trainers.type.local;
		Widgets.Party.BattleContextDelegate.pokemonHaveUpdated(entity.party.pokemon);
		Widgets.Bag.BattleContextDelegate.itemsHaveUpdated(entity.bag.items);
	},
	changeZoomLevel : function (zoom) {
		Game.zoom = zoom;
		foreach([Battle, Textbox], function (object) {
			if (typeof object === "object" && object !== null) {
				var imageSmoothingEnabled = object.canvas.getContext("2d").imageSmoothingEnabled;
				var width = Settings._("screen dimensions => width") * Game.zoom, height = Settings._("screen dimensions => height") * Game.zoom;
				object.canvas.width = width * window.devicePixelRatio;
				object.canvas.height = height * window.devicePixelRatio;
				object.canvas.style.width = width + "px";
				object.canvas.style.height = height + "px";
				object.canvas.getContext("2d").imageSmoothingEnabled = imageSmoothingEnabled;
				if (typeof object.requestRedraw !== undefined)
					object.requestRedraw = true;
			}
		});
	}
};
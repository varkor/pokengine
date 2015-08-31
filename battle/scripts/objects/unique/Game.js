Game = {
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
	},
	changeZoomLevel : function (zoom) {
		Game.zoom = zoom;
		foreach([Battle, Textbox], function (object) {
			if (typeof object === "object" && object !== null) {
				var imageSmoothingEnabled = object.canvas.getContext("2d").imageSmoothingEnabled;
				object.canvas.width = Settings._("screen dimensions => width") * Game.zoom;
				object.canvas.height = Settings._("screen dimensions => height") * Game.zoom;
				object.canvas.getContext("2d").imageSmoothingEnabled = imageSmoothingEnabled;
				if (typeof object.requestRedraw !== undefined)
					object.requestRedraw = true;
			}
		});
	}
};
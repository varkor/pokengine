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
	}
};
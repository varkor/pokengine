Game = {
	zoom : 1,
	increment : 0,
	unique : function () {
		// Returns a unique id that can be used to identify different objects
		return Game.increment ++;
	},
	player : null,
	takePossessionOf : function (entity) {
		Game.player = entity;
		entity.type = Trainers.type.local;
	}
};
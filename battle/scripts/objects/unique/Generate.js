Generate = {
	random : new srandom(),
	pokemon : {
		forCompetition : function (species, level) {
			var competitors = [], multiple = Array.isArray(species);
			species = wrapArray(species);
			foreach(species, function (particularSpecies) {
				var moveset = Pokedex._(particularSpecies).moveset;
				var potentialMoves = [];
				forevery(moveset, function (moves) {
					potentialMoves = potentialMoves.concat(moves);
				});
				competitors.push(new pokemon({
					species : particularSpecies,
					moves : Generate.random.chooseDistinctSelectionFromArray(potentialMoves, 4),
					level : arguments.length >- 2 ? level : 100
				}));
			});
			if (multiple) {
				return competitors;
			} else {
				return competitors.first();
			}
		}
	},
	species : {
		fromSelection : function (number, selection, distinct) {
			selection = selection.slice(0);
			var species = [];
			for (var i = 0; i < number; ++ i) {
				var index = Generate.random.int(selection.length);
				species.push(selection[index]);
				if (distinct) {
					selection.remove(index);
				}
			}
			return species;
		}
	}
};
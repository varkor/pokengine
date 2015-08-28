Generate = {
	random : new srandom(),
	pokemon : {
		forCompetition : function (species, level) {
			var moveset = Pokedex._(species).moveset;
			var potentialMoves = [];
			forevery(moveset, function (moves) {
				potentialMoves = potentialMoves.concat(moves);
			});
			return new pokemon({
				species : species,
				moves : Generate.random.chooseDistinctSelectionFromArray(potentialMoves, 4),
				level : arguments.length >- 2 ? level : 100
			});
		}
	},
	species : {
		fromSelection : function (number, selection, distinct) {
			selection = selection.slice(0);
			var species = [];
			for (var i = 0; i < number; ++ number) {
				var index = Generate.random.int(selection.length);
				species.push(selection[index]);
				if (distinct) {
					selection = selection.remove(index);
				}
			}
			return species;
		}
	}
};
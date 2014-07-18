Pokedex = {
	seen : [],
	caught : [],
	see : function (poke) {
		if (!Pokedex.seen.contains(poke))
			Pokedex.seen.push(poke);
	},
	capture : function (poke) {
		Pokedex.see(poke);
		if (!Pokedex.caught.contains(poke))
			Pokedex.caught.push(poke);
	}
};
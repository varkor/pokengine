Dex = {
	seen : [],
	caught : [],
	see : function (poke) {
		if (!Dex.seen.contains(poke))
			Dex.seen.push(poke);
	},
	capture : function (poke) {
		Dex.see(poke);
		if (!Dex.caught.contains(poke))
			Dex.caught.push(poke);
	}
};
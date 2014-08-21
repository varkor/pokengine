/*Settings = {
	movesAnimate : true, // Whether moves display an animation when used
	statTransitionDuration : 0.5, // How many seconds should health / experience, etc. transitions take?
	switchTransitionDuration : 0.2 // How many seconds should Pokémon being sent out, fainting, etc. take?
};*/
Settings = {
	client : {
		"animated moves" : false, // Whether moves display an animation when used
		"stat transition duration" : 0, // How many seconds should health / experience, etc. transitions take?
		"switch transition duration" : 0, // How many seconds should Pokémon being sent out, fainting, etc. take?
		"visual weather effects" : true, // Whether weather constantly displays visually, or just at the end of each turn
		"particle collision-testing" : false // Whether weather particles should implement proper collision testing
	},
	server : {
		"silently resolve rule exceptions" : true // Whether, if a client sends a party, etc. which breaks some of the set rules, BattleServer should just attempt to align the data with the rules, or whether it should send a warning message back to the client
	}
};
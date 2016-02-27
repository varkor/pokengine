"use strict";

Settings.addData({
	"screen dimensions" : { width : 356, height : 288 },
	"framerate" : 60, // The framerate—does not affect the game speed at all
	"speed" : 1, // Allows one to speed up the entire game (i.e. 1 is just normal speed, 2 is twice-as-fast, etc.)
	"font" : {
		typeface : "Open Sans",
		weight : "300"
	},
	"debug mode" : false, // Whether debug mode is enabled, which shows extra details for some objects
	"stat transition duration" : 0, // How many seconds should health / experience, etc. transitions take? [0.5]
	"switch transition duration" : 0, // How many seconds should Pokémon being sent out, fainting, etc. take? [0.2]
	"segue transition duration" : 0, // How many seconds should the battle fade in animation take? [0.5]
	"status transition duration" : 0, // How many seconds should the damage / healing, etc. animation take? [0.5]
	"ignore missing files" : false, // Whether the battle should start even if some of the required files were not loaded successfully
	"text replacements" : {
		"pokemon" : "Pokémon",
		"pokedex" : "Pokédex",
		"pokeball" : "Poké Ball"
	},
	"filter" : [], // Words that are not allowed in Pokémon nicknames
	"paths" : {
		"images" : "images/{animation}",
		"sounds" : "sounds",
		"Pokemon" : {
			"image" : "pokemon/{region}/{species}{whichform(e)}{which}{filetype=png}",
			"sound" : "pokemon/{region}/{species}{whichmega}{filetype=mp3}",
			"special" : "pokemon/{special}{which}{filetype=png}"
		},
		"characters" : {
			"image" : "characters/{game}/{who}{filetype=png}"
		},
		"scenes" : {
			"image" : "scenes/{name}{filetype=png}"
		},
		"items" : {
			"image" : "items/{name}{filetype=png}",
			"special" : "items/{special}{filetype=png}"
		}
	}
}, true);
Settings.addData({
	"keys" : {
		primary : "space",
		secondary : "Z",
		tertiary : "shift",
		up : "up",
		right : "right",
		down : "down",
		left : "left"
	},
	"animated moves" : false, // Whether moves display an animation when used [true]
	"animated sprites" : false, // Whether sprites animate when they can (slower) [true]
	"visual weather effects" : true, // Whether weather letantly displays visually, or just at the end of each turn
	"particle collision-testing" : false, // Whether weather particles should implement proper collision testing
	"sound effects" : false, // Whether sounds play or not
	"text speed" : 4,
	"switching chance" : false // Whether the player gets a chance to switch a Pokémon in before the opponent sends theirs in
}, false);
"use strict";

var paths = [
	"scripts/functions/objects.js",
	"scripts/functions/random.js",
	"scripts/processing/initialise.js",
	"scripts/objects/unique/Settings.js",
	"scripts/functions/File.js",
	"scripts/functions/Sprite.js",
	"scripts/functions/Sound.js",
	"scripts/functions/Font.js",
	"scripts/objects/unique/FileData.js",
	"scripts/data/constants.js",
	"scripts/objects/unique/Input.js",
	"scripts/objects/unique/Types.js",
	"scripts/objects/unique/Move.js",
	"scripts/objects/unique/Maps.js",
	"scripts/data/Moves.js",
	"scripts/data/Pokedex.js",
	"scripts/data/Classes.js",
	"scripts/data/Abilities.js",
	"scripts/data/Items.js",
	"scripts/data/machines.js",
	"scripts/data/accessories.js",
	"scripts/data/Events.js",
	"scripts/objects/unique/Textbox.js",
	"scripts/objects/unique/Display.js",
	"scripts/objects/unique/View.js",
	"scripts/objects/unique/Game.js",
	"scripts/objects/unique/visuals.js",
	"scripts/objects/general/dex.js",
	"scripts/objects/general/bag.js",
	"scripts/objects/general/party.js",
	"scripts/objects/general/storage.js",
	"scripts/objects/general/trainer.js",
	"scripts/objects/general/battler.js",
	"scripts/objects/general/pokemon.js",
	"scripts/objects/unique/Relay.js",
	"scripts/objects/unique/Supervisor.js",
	"scripts/objects/unique/TrialServer.js",
	"scripts/objects/general/BattleContext.js",
	"scripts/objects/unique/Debugger.js",
	"scripts/processing/process.js",

	// Dependancies
	"../../FlowGrid/FlowGrid.js",

	// Scripts that depend on the dependancies
	"scripts/objects/unique/Widgets.js"
];
var loadScript = function () {
	if (paths.notEmpty()) {
		var script = document.createElement("script");
		script.addEventListener("load", function () {
			loadScript();
		});
		script.src = paths.shift();
		document.body.appendChild(script);
	} else {
		FunctionObject.initialise();
		Interface.initialise();
	}
};
document.addEventListener("DOMContentLoaded", loadScript);
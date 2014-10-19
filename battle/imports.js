Settings = DataObject.new();
Scenes = DataObject.new();

var paths = [
	"scripts/functions/random.js",
	"scripts/objects/unique/Settings.js",
	"scripts/functions/File.js",
	"scripts/objects/unique/FileData.js",
	"scripts/data/constants.js",
	"scripts/objects/unique/Input.js",
	"scripts/objects/unique/Type.js",
	"scripts/objects/unique/Move.js",
	"scripts/objects/unique/Map.js",
	"scripts/data/Moves.js",
	"scripts/data/Pokemon.js",
	"scripts/data/Abilities.js",
	"scripts/data/Items.js",
	"scripts/data/machines.js",
	"scripts/data/accessories.js",
	"scripts/objects/unique/Widgets.js",
	"scripts/objects/unique/Textbox.js",
	"scripts/objects/unique/Display.js",
	"scripts/objects/unique/View.js",
	"scripts/objects/unique/Game.js",
	"scripts/objects/unique/Pokedex.js",
	"scripts/objects/unique/visuals.js",
	"scripts/objects/general/bag.js",
	"scripts/objects/general/party.js",
	"scripts/objects/general/trainer.js",
	"scripts/objects/general/battler.js",
	"scripts/objects/general/pokemon.js",
	"scripts/objects/unique/Client.js",
	"scripts/objects/unique/Battle.js",
	"scripts/objects/unique/Debugger.js"
];
var loadScript = function () {
	if (paths.notEmpty()) {
		script = document.createElement("script");
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
window.addEventListener("DOMContentLoaded", loadScript);
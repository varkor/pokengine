Sprite = {
	load : function (path, alias, external) {
		alias = alias || path;
		if (Sprites.hasOwnProperty(alias))
			return Sprites[alias];
		else if (Sprites.hasOwnProperty(path)) {
			Sprites[alias] = Sprites[path];
			return Sprites[alias];
		}
		var image = new Image();
		if (path.substr(0, 5) === "data:")
			external = true;
		image.src = (!external ? "images/" + path + ".png" : path);
		Sprites[path] = null;
		Sprites[alias] = null;
		image.addEventListener("load", function (event) {
			Sprites[path] = image;
			Sprites[alias] = image;
		});
		return null;
	}
};
Sprites = {};
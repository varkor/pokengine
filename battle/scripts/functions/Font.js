Font = {
	load : function (size, weight, style, typeface) {
		size *= window.devicePixelRatio;
		if (!["px", "pt", "em", "rem"].contains(("" + size).substr(-2)))
			size += "px";
		return (style || "") + " " + (weight || Settings._("font").weight) + " " + size + " " + (typeface || Settings._("font").typeface);
	},
	loadFromStyle : function (style, zoom) {
		return Font.load(style.size * (arguments.length >= 2 ? zoom : 1), style.weight, style.style);
	}
};
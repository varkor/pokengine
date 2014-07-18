View = {
	reset : function () {
		View.position = { // Offset is at top-left, to make positioning easier
			x : 0,
			y : 0
		};
		View.zoom = 1;
		View.angle = 0;
	}
};
View.reset();
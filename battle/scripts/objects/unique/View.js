"use strict";

const View = {
	reset : function () {
		// Rotation is perfomed, then zoom, then position offsetting, so positioning is orthagonal to the x-y direction rotated by View.angle radians
		View.position = { // Offset is relative to centre, so zooming will magnify the centre unless it is offset
			x : 0,
			y : 0
		};
		View.zoom = 1;
		View.angle = 0;
	}
};
View.reset();
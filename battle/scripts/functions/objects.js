DataObject = {
	new : function () {
		var object = {
			data : {},
			_ : function (path) {
				return _(object.data, path);
			},
			__ : function (fn) {
				var broken = false;
				for (var key in object.data) {
					if (broken = fn(object.data[key], key, object.data))
						return broken;
				}
				return broken;
			},
			addData : function (data) {
				for (var key in data) {
					object.data[key] = data[key];
				}
			},
			addMethods : function (methods) {
				for (var key in methods) {
					if (!object.hasOwnProperty(key))
						object[key] = methods[key];
					else
						throw "That object already has a property with the name: " + key;
				}
			}
		};
		return object;
	}
};

FunctionObject = {
	objects : [],
	new : function (object, details) {
		if (details.hasOwnProperty("initialise"))
			object.initialise = details.initialise;
		if (details.hasOwnProperty("update"))
			object.update = details.update;
		if (details.hasOwnProperty("drawing")) {
			if (details.drawing.hasOwnProperty("canvas")) {
				var initialise = object.initialise;
				object.initialise = function () {
					if (initialise)
						initialise();
					var canvas;
					if (details.drawing.canvas.hasOwnProperty("selector"))
						canvas = document.querySelector(details.drawing.canvas.selector);
					else {
						canvas = document.createElement("canvas");
						if (document.body.childNodes.length > 0)
							document.body.insertBefore(canvas, document.body.childNodes[0]);
						else
							document.body.append(canvas);
					}
					if (details.drawing.canvas.hasOwnProperty("className"))
						canvas.className = details.drawing.canvas.className;
					canvas.width = details.drawing.canvas.width;
					canvas.height = details.drawing.canvas.height;
					if (details.drawing.canvas.hasOwnProperty("smoothing") && !details.drawing.canvas.smoothing)
						canvas.getContext("2d").imageSmoothingEnabled = false;
					object.canvas = canvas;
					object.draw = function () {
						details.drawing.draw(object.canvas);
					};
				}
				details.initialise = object.initialise;
			} else {
				object.draw = details.drawing.draw;
			}
		}
		FunctionObject.objects.push({
			object : object,
			initialise : details.hasOwnProperty("initialise"),
			update : details.hasOwnProperty("update"),
			draw : details.hasOwnProperty("drawing")
		});
		return object;
	},
	initialise : function () {
		foreach(FunctionObject.objects, function (object) {
			if (object.initialise)
				object.object.initialise();
		});
		window.setInterval(function () {
			foreach(FunctionObject.objects, function (object) {
				if (object.update)
					object.object.update();
			});
		}, Time.refresh);
		var draw = function () {
			window.requestAnimationFrame(function () {
				foreach(FunctionObject.objects, function (object) {
					if (object.draw && object.object.draw) {
						object.object.draw();
					}
				});
				draw();
			});
		};
		draw();
	}
};
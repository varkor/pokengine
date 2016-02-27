"use strict";

let DataObject = {
	new : function () {
		var object = {
			data : {},
			flags : {},
			dataForFlag : function (forFlag) {
				var filtered = {};
				object.__(function (data, key, flag) {
					if (flag === forFlag)
						filtered[key] = data;
				});
				return filtered;
			},
			_ : function (path, newValue) {
				if (arguments.length >= 2) {
					return _(object.data, path, newValue);
				} else {
					return _(object.data, path);
				}
			},
			__ : function (fn) {
				var broken = false;
				for (var key in object.data) {
					broken = fn(object.data[key], key, object.flags[key], object.data);
					if (broken)
						return broken;
				}
				return broken;
			},
			addData : function (data, flag) {
				for (var key in data) {
					object.data[key] = data[key];
					object.flags[key] = flag;
				}
			},
			addMethods : function (methods) {
				for (var key in methods) {
					if (!object.hasOwnProperty(key))
						object[key] = methods[key];
					else
						throw new Error("That object already has a property with the name: " + key);
				}
			}
		};
		return object;
	}
};

let FunctionObject = {
	objects : [],
	initialised : false,
	new : function (object, details) {
		if (details.hasOwnProperty("initialise"))
			object.initialise = details.initialise;
		if (details.hasOwnProperty("update"))
			object.update = details.update;
		if (details.hasOwnProperty("drawing")) {
			if (details.drawing.hasOwnProperty("canvas")) {
				var initialise = object.initialise;
				var passive = details.drawing.hasOwnProperty("passive") && details.drawing.passive;
				object.requestRedraw = false;
				object.initialise = function () {
					if (initialise)
						initialise(object);
					var canvas = null;
					if (details.drawing.canvas.hasOwnProperty("selector"))
						canvas = document.querySelector(details.drawing.canvas.selector);
					if (canvas === null) {
						delete details.drawing.canvas.selector;
						canvas = document.createElement("canvas");
						if (document.body.childNodes.length > 0)
							document.body.insertBefore(canvas, document.body.childNodes[0]);
						else
							document.body.appendChild(canvas);
					}
					if (details.drawing.canvas.hasOwnProperty("className"))
						canvas.className = details.drawing.canvas.className;
					if (details.drawing.canvas.hasOwnProperty("focusable") && details.drawing.canvas.focusable)
						canvas.tabIndex = 0;
					canvas.width = details.drawing.canvas.width * window.devicePixelRatio;
					canvas.height = details.drawing.canvas.height * window.devicePixelRatio;
					canvas.style.width = details.drawing.canvas.width + "px";
					canvas.style.height = details.drawing.canvas.height + "px";
					if (details.drawing.canvas.hasOwnProperty("smoothing") && !details.drawing.canvas.smoothing)
						canvas.getContext("2d").imageSmoothingEnabled = false;
					object.canvas = canvas;
					object.draw = function (automatic) {
						if (!passive || object.requestRedraw || !automatic)
							details.drawing.draw(object.canvas);
						object.requestRedraw = false;
					};
				};
				details.initialise = object.initialise;
			} else {
				object.draw = function (automatic) {
					if (!passive || object.requestRedraw || !automatic)
						details.drawing.draw();
					object.requestRedraw = false;
				};
			}
		}
		var entry;
		FunctionObject.objects.push(entry = {
			object : object,
			initialise : details.hasOwnProperty("initialise"),
			update : details.hasOwnProperty("update"),
			draw : details.hasOwnProperty("drawing")
		});
		object.destroy = function () {
			if (details.hasOwnProperty("drawing") && details.drawing.hasOwnProperty("canvas") && !details.drawing.canvas.hasOwnProperty("selector"))
				object.canvas.parentElement.removeChild(object.canvas);
			FunctionObject.objects.removeElementsOfValue(entry);
		};
		if (FunctionObject.initialised && entry.initialise) {
			entry.object.initialise();
		}
		return object;
	},
	initialise : function () {
		if (FunctionObject.initialised)
			return;
		FunctionObject.initialised = true;
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
						object.object.draw(true);
					}
				});
				draw();
			});
		};
		draw();
	}
};
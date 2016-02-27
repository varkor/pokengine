"use strict";

function srandom (seed) {
	var self = this;
	
	if (arguments.length >= 1)
		self.seed = seed;
	else self.seed = Math.random();
	
	self.point = function () {
		var x = Math.sin(self.seed = self.increase(self.seed)) * 1000000;
		return x - Math.floor(x);
	};
	
	self.increase = function (value) {
		var jump = 1;
		while (value === (value += jump) && jump < Math.pow(10, 10)) {
			if (jump >= Math.pow(10, 2))
				jump *= 10;
			else
				++ jump;
		}
		return value;
	};
	
	self.number = function (x, y) {
		var point = self.point();
		if (arguments.length === 0)
			return point;
		if (arguments.length === 1)
			return point * x;
		else if (arguments.length === 2)
			return Math.min(x, y) + point * Math.abs(x - y);
	};
	
	self.int = function (x, y) {
		if (arguments.length === 1)
			return Math.round(self.number(x));
		else if (arguments.length === 2)
			return Math.round(self.number(x, y));
	};
	
	self.chance = function (x, y) {
		if (arguments.length === 1)
			return self.int(x - 1) === 0;
		else
			return self.int(y - 1) <= x - 1;
	};
	
	self.percentage = function (x) {
		return self.point() * 100 <= x;
	};
	
	self.choose = function () {
		return arguments[self.int(arguments.length - 1)];
	};
	
	self.chooseFromArray = function (array) {
		return array[self.int(array.length - 1)];
	};

	self.chooseDistinctSelectionFromArray = function (array, number) {
		var subarray = array.slice(0), selection = [];
		for (var i = 0, j; i < number; ++ i) {
			selection = selection.concat(subarray.splice(self.int(subarray.length - 1), 1));
		}
		return selection;
	};
	
	self.chooseWeighted = function () {
		var r = self.point(), accumulator = 0;
		for (var i = 0, choice; i < arguments.length; ++ i) {
			choice = arguments[i];
			if (r <= (accumulator += choice.probability)) {
				return choice.value;
			}
		}
	};
}
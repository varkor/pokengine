"use strict";

function dex (data) {
	var self = this;

	if (arguments.length < 1)
		data = {};
	else
		data = JSONCopy(data);

	self.seen = arguments.length >= 1 && data.hasOwnProperty("seen") ? data.seen : [];
	self.caught = arguments.length >= 1 && data.hasOwnProperty("caught") ? data.caught : [];

	self.store = function () {
		return JSONCopy({
			seen : self.seen,
			caught : self.caught
		});
	};

	self.see = function (poke) {
		if (!self.seen.contains(poke))
			self.seen.push(poke);
	};

	self.capture = function (poke) {
		self.see(poke);
		if (!self.caught.contains(poke))
			self.caught.push(poke);
	};
}
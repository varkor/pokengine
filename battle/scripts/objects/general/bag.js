function bag () {
	var self = this;

	self.items = [];

	self.add = function (item, quantity) {
		if (arguments.length < 2)
			quantity = 1;
		if (!foreach(self.items, function (which) {
			if (which.item === item) {
				which.quantity += quantity;
				return true;
			}
		}))
			self.items.push({item : item, quantity : quantity});
	};

	self.remove = function (item, quantity) {
		if (arguments.length < 2)
			quantity = 1;
		var index;
		if (typeof item !== "number") {
			foreach(self.items, function (which, i) {
				if (which.item === item) {
					index = i;
					return true;
				}
			});
		} else
			index = item;
		self.items[index].quantity -= quantity;
		if (self.items[index].quantity <= 0)
			self.items.remove(index);
	};

	self.toss = function (item) {
		var index;
		if (typeof item !== "number") {
			foreach(self.items, function (which, i) {
				if (which.item === item) {
					index = i;
					return true;
				}
			});
		} else
			index = item;
		self.items.remove(index);
	};

	self.has = function (item) {
		return foreach(self.items, function (which, i) {
			if (which.item === item)
				return true;
		});
	};

	self.use = function (item, on) {
		var index;
		if (typeof item !== "number") {
			foreach(self.items, function (which, i) {
				if (which.item === item) {
					index = i;
					return true;
				}
			});
		} else
			index = item;
		self.items[index].item.effect(self.items[index].item, on);
		self.remove(index);
	};

	self.empty = function () {
		return self.items.length === 0;
	};
}
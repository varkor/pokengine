Debugger = FunctionObject.new({
	previousFrame : performance.now(),
	fps : {
		statistics : function () {
			var past = Time.framerate, mean = 0, variance = 0; // Analyse the past so many frames
			for (var i = Debugger.fps.timeline.length - 1; i >= 0 && i >= Debugger.fps.timeline.length - past; -- i) {
				mean += Debugger.fps.timeline[i];
				variance += Math.pow(Debugger.fps.timeline[i], 2);
			}
			mean /= past;
			variance = (variance / past) - Math.pow(mean, 2);
			return {
				mean : mean,
				variance : variance,
				standardDeviation : Math.sqrt(variance)
			};
		},
		framerate : function () {
			return Debugger.fps.statistics().mean;
		},
		timeline: [],
		canvas : null,
	},
	error : function (message, specific) {
		if (arguments.length < 2)
			console.log("%c" + message, "color : hsl(0, 100%, 40%)");
		else
			console.log("%c" + message + ": ", "color : hsl(0, 100%, 40%)", specific);
	}
}, {
	update : function () {
		var thisFrame = performance.now();
		if (thisFrame !== Debugger.previousFrame) { // Occasionally the timestep is so small it's called in the same millisecond as the previous call, so we just want to ignore those
			Debugger.fps.timeline.push(Time.second / (thisFrame - Debugger.previousFrame));
			Debugger.previousFrame = thisFrame;
		}
	},
	drawing : {
		canvas : {
			width : 96,
			height : 32,
			className : "fps"
		},
		draw : function (canvas) {
			var context = canvas.getContext("2d");
			context.textAlign = "left";
			context.textBaseline = "middle";
			context.fillStyle = "hsla(0, 0%, 0%, 1)";
			context.fillRect(0, 0, canvas.width, canvas.height);
			var fps = Debugger.fps.framerate(), sd = Debugger.fps.statistics().standardDeviation;
			context.beginPath();
			context.moveTo(0, (fps / Time.framerate) * canvas.height);
			context.lineTo(canvas.width, (fps / Time.framerate) * canvas.height);
			context.strokeStyle = "hsla(0, 0%, 100%, 0)";
			context.stroke();
			var gradient = context.createLinearGradient(0, 0, canvas.width, 0);
			context.beginPath();
			var past = Time.framerate;
			for (var i = Debugger.fps.timeline.length - 1, j = Time.framerate - 1, x; i >= 0 && i >= Debugger.fps.timeline.length - past; -- i, -- j) {
				x = ((j - Math.max(0, Time.framerate - Debugger.fps.timeline.length)) / (Time.framerate - 1)) * canvas.width;
				context.lineTo(x, (1 - ((Time.framerate - Debugger.fps.timeline[i]) / Time.framerate)) * canvas.height);
				gradient.addColorStop(Math.clamp(0, x / canvas.width, 1), "hsla(" + (Debugger.fps.timeline[i] / Time.framerate) * 60 + ", 100%, 50%, " + 1/*Math.pow(Math.max(0, 1 - Debugger.fps.timeline[i] / Time.framerate), 0.5)*/ + ")");
			}
			context.lineTo(0, canvas.height);
			context.lineTo((Math.min(Time.framerate, Debugger.fps.timeline.length) / Time.framerate) * canvas.width, canvas.height);
			context.fillStyle = gradient;
			context.fill();
			context.fillStyle = "white";
			var fontSize = Math.min(canvas.width / 6, canvas.height / 2);
			context.font = Font.load(fontSize);
			context.fillText("fps: " + fps.toFixed(1), Math.min(fontSize, 16), canvas.height / 2);
		}
	}
});
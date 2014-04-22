var util = require('util');

function colorize (str, color) {
	var options = {
			red:      '\u001b[31m',
			green:    '\u001b[32m',
			yellow:   '\u001b[33m',
			blue:     '\u001b[34m',
			magenta:  '\u001b[35m',
			cyan:     '\u001b[36m',
			gray:     '\u001b[90m',
			reset:    '\u001b[0m'
	};

	if(typeof options[color] === 'undefined') return str;
	return options[color] + str + options.reset;
};

function pad (str, width) {
	return Array(parseInt(width, 10) - (str + '').length).join(' ') + str;
};

module.exports = ModeError;

function ModeError (msg) {
	Error.call(this);

	this.message 	= msg;
	this.name 		= 'ModeError';
	this.memory 	= process.memoryUsage();

	var orig = Error.prepareStackTrace;
	
	Error.prepareStackTrace = function(_, stack) { 
		return stack; 
	};
		
	Error.captureStackTrace(this, arguments.callee);
	
	this.__stack = this.stack;
	
	Error.prepareStackTrace = orig;

	this._stack = [];
	
	for (var i = 0; i < this.__stack.length; i ++) {
		var frame = this.__stack[i];
		this._stack.push({
			filename: frame.getFileName(),
			typename: frame.getTypeName(),
			linenum: frame.getLineNumber(),
			funcname: frame.getFunctionName(),
			method: frame.getMethodName()
		});
	}

	Object.defineProperty(this, 'stack', {
		get: function () {
			var buf = [];
			buf.push('');
			buf.push(pad('', 8) + colorize(this.name, 'red'));
			buf.push(pad('', 8) + colorize(Array(this.name.length + 1).join('-'), 'gray'));
			buf.push(pad('', 8) + colorize(this.message, 'magenta'));
			buf.push(pad('', 8) + colorize((this.memory.heapTotal / 1048576).toFixed(3) + ' MB', 'blue') + colorize(' total ', 'gray'));
			buf.push(pad('', 8) + colorize((this.memory.heapUsed / 1048576).toFixed(3) + ' MB', 'blue') + colorize(' used  ', 'gray'));
			buf.push(pad('', 8) + colorize(Array(this.name.length + 1).join('-'), 'gray'));
			buf.push('');

			this._stack.forEach(function (frame) {
				buf.push('  ' + colorize(pad(frame.linenum + '', 5), 'blue') + colorize(' ' + frame.filename, 'gray') );
				buf.push(pad('', 8) + colorize((frame.funcname ? frame.funcname : 'Anonymous'), 'green') + ' ' + colorize('[' + frame.typename + ']', 'yellow'));
			});

			buf.push('');
			return buf.join('\n');
		}
	});
}

util.inherits(ModeError, Error);

ModeError.prototype.toJSON = function () {
	return {
		name: this.name,
		message: this.message,
		memory: this.memory,
		stack: this._stack
	};
}





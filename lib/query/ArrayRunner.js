"use strict";

var Runner = require("./Runner");

/**
 * This class is an array runner used to run a pipeline against a static array of data
 * @class ArrayRunner
 * @extends mungedb-aggregate.query.Runner
 * @namespace mungedb-aggregate.query
 * @module mungedb-aggregate
 * @constructor
 * @param {Array} items The array source of the data
 */
var klass = module.exports = function ArrayRunner(array){
	base.call(this);
	if (!(array instanceof Array)) throw new Error("Array runner requires an array");
	this._array = array;
	this._position = 0;
	this._state = Runner.RunnerState.RUNNER_ADVANCED;
}, base = Runner, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}}); //jshint ignore:line

/**
 * Get the next result from the array.
 * @method getNext
 * @param callback {Function}
 */
proto.getNext = function getNext(callback) {
	var obj, err;
	if (this._state === Runner.RunnerState.RUNNER_ADVANCED) {
		if (this._position < this._array.length){
			obj = this._array[this._position++];
		} else {
			this._state = Runner.RunnerState.RUNNER_EOF;
		}
	}
	return callback(err, obj, this._state);
};

/**
 * Save any state required to yield.
 * @method saveState
 */
proto.saveState = function saveState() {
	//nothing to do here
};

/**
 * Restore saved state, possibly after a yield.  Return true if the runner is OK, false if
 * it was killed.
 * @method restoreState
 */
proto.restoreState = function restoreState() {
	//nothing to do here
};

/**
 * Returns a description of the Runner
 * @method getInfo
 * @param [explain]
 * @param [planInfo]
 */
proto.getInfo = function getInfo(explain) {
	if (explain){
		return {
			type: this.constructor.name,
			nDocs: this._array.length,
			position: this._position,
			state: this._state
		};
	}
	return undefined;
};
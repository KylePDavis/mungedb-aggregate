"use strict";

/** 
 * An $minute pipeline expression. 
 * @see evaluate 
 * @class MinuteExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var MinuteExpression = module.exports = function MinuteExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = MinuteExpression, base = require("./NaryExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$minute";
};

proto.addOperand = function addOperand(expr) {
	this.checkArgLimit(1);
	base.prototype.addOperand.call(this, expr);
};

/** 
 * Takes a date and returns the minute between 0 and 59. 
 * @method evaluate
 **/
proto.evaluate = function evaluate(doc){
	this.checkArgCount(1);
	var date = this.operands[0].evaluate(doc);
	return date.getUTCMinutes();
};

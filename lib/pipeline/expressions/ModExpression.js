"use strict";

/** 
 * An $mod pipeline expression. 
 * @see evaluate 
 * @class ModExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var ModExpression = module.exports = function ModExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = ModExpression, base = require("./NaryExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var Value = require("../Value");

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$mod";
};

proto.addOperand = function addOperand(expr) {
	this.checkArgLimit(2);
	base.prototype.addOperand.call(this, expr);
};

/** 
 * Takes an array that contains a pair of numbers and returns the remainder of the first number divided by the second number. 
 * @method evaluate
 **/
proto.evaluate = function evaluate(doc){
	this.checkArgCount(2);
	var left = this.operands[0].evaluate(doc),
		right = this.operands[1].evaluate(doc);
	if(left instanceof Date || right instanceof Date) throw new Error("$mod does not support dates; code 16374");

	// pass along jstNULLs and Undefineds
	if(left === undefined || left === null) return left;
	if(right === undefined || right === null) return right;

	// ensure we aren't modding by 0
	right = Value.coerceToDouble(right);
	if(right === 0) return undefined;

	left = Value.coerceToDouble(left);
	return left % right;
};

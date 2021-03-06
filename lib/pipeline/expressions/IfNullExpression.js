"use strict";

/**
 * An $ifNull pipeline expression.
 * @see evaluate
 * @class IfNullExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 **/
var IfNullExpression = module.exports = function IfNullExpression(){
	if (arguments.length !== 0) throw new Error("zero args expected");
	base.call(this);
}, klass = IfNullExpression, base = require("./NaryExpression"), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// PROTOTYPE MEMBERS
proto.getOpName = function getOpName(){
	return "$ifNull";
};

proto.addOperand = function addOperand(expr) {
	this.checkArgLimit(2);
	base.prototype.addOperand.call(this, expr);
};

/**
 * Use the $ifNull operator with the following syntax: { $ifNull: [ <expression>, <replacement-if-null> ] }
 * @method evaluate
 **/
proto.evaluate = function evaluate(doc){
	this.checkArgCount(2);
	var left = this.operands[0].evaluate(doc);
	if(left !== undefined && left !== null) return left;
	var right = this.operands[1].evaluate(doc);
	return right;
};

"use strict";

/**
 * A $setDifference pipeline expression.
 * @class SetDifferenceExpression
 * @namespace mungedb-aggregate.pipeline.expressions
 * @module mungedb-aggregate
 * @constructor
 */
var SetDifferenceExpression = module.exports = function SetDifferenceExpression() {
	if (arguments.length !== 0) throw new Error(klass.name + ": no args expected");
	base.call(this);
}, klass = SetDifferenceExpression, base = require("./FixedArityExpressionT")(SetDifferenceExpression, 2), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}}); //jshint ignore:line

var Value = require("../Value"),
	Expression = require("./Expression"),
	ValueSet = require("../ValueSet");

proto.evaluateInternal = function evaluateInternal(vars) {
	var lhs = this.operands[0].evaluateInternal(vars),
		rhs = this.operands[1].evaluateInternal(vars);

	if (lhs === undefined || lhs === null || rhs === undefined || rhs === null) {
		return null;
	}

	if (!(lhs instanceof Array))
		throw new Error("both operands of " + this.getOpName() + " must be arrays. First " +
			"argument is of type: " + Value.getType(lhs) + "; uassert code 17048");
	if (!(rhs instanceof Array))
		throw new Error("both operands of " + this.getOpName() + " must be arrays. Second " +
			"argument is of type: " + Value.getType(rhs) + "; uassert code 17049");

	var rhsSet = new ValueSet(rhs),
		lhsArray = lhs,
		returnVec = [];
	for (var i = 0, l = lhsArray.length; i < l; ++i) {
		// rhsSet serves the dual role of filtering out elements that were originally present
		// in RHS and of eleminating duplicates from LHS
		var it = lhsArray[i];
		if (rhsSet.insert(it) !== undefined) {
			returnVec.push(it);
		}
	}
	return returnVec;
};

Expression.registerExpression("$setDifference", base.parse);

proto.getOpName = function getOpName() {
	return "$setDifference";
};
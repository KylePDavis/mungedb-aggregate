"use strict";
var MatchExpression = require('./MatchExpression');

	// Autogenerated by cport.py on 2013-09-17 14:37
var NotMatchExpression = module.exports = function NotMatchExpression(){
	base.call(this);
	this._matchType = 'NOT';
}, klass = NotMatchExpression, base =  Object  , proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

	// File: expression_tree.h lines: 152-152
proto._exp = undefined;

/**
 *
 * Writes a debug string for this object
 * @method debugString
 * @param level
 *
 */
proto.debugString = function debugString(level) {
	// File: expression_tree.cpp lines: 146-149
	return this._debugAddSpace( level ) + "$not\n" + this._exp._debugString( level + 1 );
};

/**
 *
 * checks if this expression is == to the other
 * @method equivalent
 * @param other
 *
 */
proto.equivalent = function equivalent(other) {
	// File: expression_tree.cpp lines: 152-156
	return other._matchType == 'NOT' && this._exp.equivalent(other.getChild(0));
};

/**
 *
 * Return the _exp property
 * @method getChild
 *
 */
proto.getChild = function getChild() {
	// File: expression_tree.h lines: 148-147
	return this._exp;
};

/**
 *
 * Initialize the necessary items
 * @method init
 * @param exp
 *
 */
proto.init = function init(exp) {
	// File: expression_tree.h lines: 123-125
	this._exp = exp;
	return {'code':'OK'};
};

/**
 *
 * matches checks the input doc against the internal element path to see if it is a match
 * @method matches
 * @param doc
 * @param details
 *
 */
proto.matches = function matches(doc,details) {
	// File: expression_tree.h lines: 135-136
	return ! this._exp.matches( doc,null );
};

/**
 *
 * Check if the input element matches
 * @method matchesSingleElement
 * @param e
 *
 */
proto.matchesSingleElement = function matchesSingleElement(e) {
	// File: expression_tree.h lines: 139-140
	return ! this._exp.matchesSingleElement( e );
};

/**
 *
 * Return the number of children contained by this expression
 * @method numChildren
 * @param
 *
 */
proto.numChildren = function numChildren(){
	// File: expression_tree.h lines: 147-146
	return 1;
};

/**
 *
 * clone this instance to a new one
 * @method shallowClone
 *
 */
proto.shallowClone = function shallowClone(){
	// File: expression_tree.h lines: 128-132
	var e = new NotMatchExpression();
	e.init(this._exp.shallowClone());
	return e;
};

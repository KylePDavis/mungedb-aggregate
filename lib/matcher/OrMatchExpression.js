"use strict";
var ListOfMatchExpression = require("./ListOfMatchExpression");

var OrMatchExpression = module.exports = function OrMatchExpression (){
	base.call(this);
	this._expressions = [];
	this._matchType = "OR";
}, klass = OrMatchExpression, base = ListOfMatchExpression, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}}); //jshint ignore:line

/**
 *
 * Writes a debug string for this object
 * @method debugString
 * @param level
 *
 */
proto.debugString = function debugString(level) {
	return this._debugAddSpace(level) +
		"$or\n" +
		this._debugList(level);
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
	for (var i = 0; i < this.numChildren(); i++) {
		if (this.getChild(i).matches( doc, null ) ){
			return true;
		}
	}
	return false;
};

/**
 *
 * Check if the input element matches
 * @method matchesSingleElement
 * @param e
 *
 */
proto.matchesSingleElement = function matchesSingleElement(e) {
	for (var i = 0; i < this.numChildren(); i++) {
		if( this.getChild(i).matchesSingleElement(e) ) {
			return true;
		}
	}
	return false;
};

/**
 *
 * clone this instance to a new one
 * @method shallowClone
 *
 */
proto.shallowClone = function shallowClone(){
	var clone = new OrMatchExpression();

	for (var i = 0; i < this.numChildren(); i++) {
		clone.add(this.getChild(i).shallowClone());
	}

	if (this.getTag()) {
		clone.setTag(this.getTag().clone());
	}

	return clone;
};
"use strict";

// Autogenerated by cport.py on 2013-09-17 14:37
var Matcher2 = module.exports = function Matcher2(pattern, nested){
	// File: matcher.cpp lines: 83-92
	this._pattern = pattern;
	this.parser = new MatchExpressionParser();
	var result = this.parser.parse(pattern);
	if (result.code != ErrorCodes.OK)
		return {code:16810, description:"bad query: " + result};
	this._expression = result.result;
}, klass = Matcher2, base = Object, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});

// DEPENDENCIES
var errors = require("../../Errors.js"),
	ErrorCodes = errors.ErrorCodes,
	MatchExpression = require("./MatchExpression.js"),
	MatchExpressionParser = require("./MatchExpressionParser.js"),
	FalseMatchExpression = require("./FalseMatchExpression.js"),
	ComparisonMatchExpression = require("./ComparisonMatchExpression.js"),
	InMatchExpression = require("./InMatchExpression.js"),
	AndMatchExpression = require("./AndMatchExpression.js"),
	OrMatchExpression = require("./OrMatchExpression.js"),
	IndexKeyMatchableDocument = require('./IndexKeyMatchableDocument.js'),
	ListOfMatchExpression = require('./ListOfMatchExpression.js'),
	LeafMatchExpression = require("./LeafMatchExpression.js");

// File: matcher.h lines: 82-82
proto._expression = undefined;

// File: matcher.h lines: 80-80
proto._indexKey = undefined;

// File: matcher.h lines: 79-79
proto._pattern = undefined;

// File: matcher.h lines: 84-84
proto._spliceInfo = undefined;

/**
 *
 * Figure out where our index is
 * @method _spliceForIndex
 * @param keys
 * @param full
 * @param spliceInfo
 *
 */
proto._spliceForIndex = function _spliceForIndex(keys, full, spliceInfo){
	// File: matcher.cpp lines: 236-380
	var dup, i, obj, lme;
	switch (full) {
		case MatchExpression.ALWAYS_FALSE:
			return new FalseMatchExpression();

		case MatchExpression.GEO_NEAR:
		case MatchExpression.NOT:
		case MatchExpression.NOR:
			// maybe?
			return null;

		case MatchExpression.OR:

		case MatchExpression.AND:
			dup = new ListOfMatchExpression();
			for (i = 0; i < full.numChildren(); i++) {
				var sub = this._spliceForIndex(keys, full.getChild(i), spliceInfo);
				if (!sub)
					continue;
				if (!dup.get()) {
					if (full.matchType() == MatchExpression.AND)
						dup.reset(new AndMatchExpression());
					else
						dup.reset(new OrMatchExpression());
				}
				dup.add(sub);
			}
			if (dup.get()) {
				if (full.matchType() == MatchExpression.OR &&  dup.numChildren() != full.numChildren()) {
					// TODO: I think this should actuall get a list of all the fields
					// and make sure that's the same
					// with an $or, have to make sure its all or nothing
					return null;
				}
				return dup.release();
			}
			return null;

		case MatchExpression.EQ:
			var cmp = new ComparisonMatchExpression(full);

			if (cmp.getRHS().type() == Array) {
				// need to convert array to an $in

				if (!keys.count(cmp.path().toString()))
					return null;

				var newIn = new InMatchExpression();
				newIn.init(cmp.path());

				if (newIn.getArrayFilterEntries().addEquality(cmp.getRHS()).isOK())
					return null;

				if (cmp.getRHS().Obj().isEmpty())
					newIn.getArrayFilterEntries().addEquality(undefined);

				obj = cmp.getRHS().Obj();
				for(i in obj) {
					var s = newIn.getArrayFilterEntries().addEquality( obj[i].next() );
					if (s.code != ErrorCodes.OK)
						return null;
				}

				return newIn.release();
			}
			else if (cmp.getRHS().type() === null) {
				//spliceInfo.hasNullEquality = true;
				return null;
			}
			break;

		case MatchExpression.LTE:
		case MatchExpression.LT:
		case MatchExpression.GT:
		case MatchExpression.GTE:
			cmp = new ComparisonMatchExpression(full);

			if ( cmp.getRHS().type() === null) {
				// null and indexes don't play nice
				//spliceInfo.hasNullEquality = true;
				return null;
			}
			break;

		case MatchExpression.REGEX:
		case MatchExpression.MOD:
			lme = new LeafMatchExpression(full);
			if (!keys.count(lme.path().toString()))
				return null;
			return lme.shallowClone();

		case MatchExpression.MATCH_IN:
			lme = new LeafMatchExpression(full);
			if (!keys.count(lme.path().toString()))
				return null;
			var cloned = new InMatchExpression(lme.shallowClone());
			if (cloned.getArrayFilterEntries().hasEmptyArray())
				cloned.getArrayFilterEntries().addEquality(undefined);

			// since { $in : [[1]] } matches [1], need to explode
			for (i = cloned.getArrayFilterEntries().equalities().begin(); i != cloned.getArrayFilterEntries().equalities().end(); ++i) {
				var x = cloned[i];
				if (x.type() == Array) {
					for(var j in x) {
						cloned.getArrayFilterEntries().addEquality(x[j]);
					}
				}
			}

			return cloned;

		case MatchExpression.ALL:
			// TODO: convert to $in
			return null;

		case MatchExpression.ELEM_MATCH_OBJECT:
		case MatchExpression.ELEM_MATCH_VALUE:
			// future
			return null;

		case MatchExpression.GEO:
		case MatchExpression.SIZE:
		case MatchExpression.EXISTS:
		case MatchExpression.NIN:
		case MatchExpression.TYPE_OPERATOR:
		case MatchExpression.ATOMIC:
		case MatchExpression.WHERE:
			// no go
			return null;
	}

	return null;
};

/**
 *
 * return if our _expression property is atomic or not
 * @method atomic
 *
 */
proto.atomic = function atomic(){
	// File: matcher.cpp lines: 120-133
	if (!this._expression)
		return false;

	if (this._expression.matchType() == MatchExpression.ATOMIC)
		return true;

	// we only go down one level
	for (var i = 0; i < this._expression.numChildren(); i++) {
		if (this._expression.getChild(i).matchType() == MatchExpression.ATOMIC)
			return true;
	}

	return false;
};

/**
 *
 * Return the _pattern property
 * @method getQuery
 *
 */
proto.getQuery = function getQuery(){
	// File: matcher.h lines: 65-64
	return this._pattern;
};

/**
 *
 * Check if we exist
 * @method hasExistsFalse
 *
 */
proto.hasExistsFalse = function hasExistsFalse(){
	// File: matcher.cpp lines: 172-180
	if (this._spliceInfo.hasNullEquality) {
		// { a : NULL } is very dangerous as it may not got indexed in some cases
		// so we just totally ignore
		return true;
	}

	return this._isExistsFalse(this._expression.get(), false, this._expression.matchType() == MatchExpression.AND ? -1 : 0);
};

/**
 *
 * Find if we have a matching key inside us
 * @method keyMatch
 * @param docMatcher
 *
 */
proto.keyMatch = function keyMatch(docMatcher){
	// File: matcher.cpp lines: 199-206
	if (!this._expression)
		return docMatcher._expression.get() === null;
	if (!docMatcher._expression)
		return false;
	if (this._spliceInfo.hasNullEquality)
		return false;
	return this._expression.equivalent(docMatcher._expression.get());
};

/**
 *
 * matches checks the input doc against the internal element path to see if it is a match
 * @method matches
 * @param doc
 * @param details
 *
 */
proto.matches = function matches(doc, details){
	// File: matcher.cpp lines: 105-116
	if (!this._expression)
		return true;

	if (this._indexKey == {})
		return this._expression.matchesBSON(doc, details);

	if ((doc != {}) && (Object.keys(doc)[0]))
		return this._expression.matchesBSON(doc, details);

	var mydoc = new IndexKeyMatchableDocument(this._indexKey, doc);
	return this._expression.matches(mydoc, details);
};

/**
 *
 * Check if we are a simple match
 * @method singleSimpleCriterion
 *
 */
proto.singleSimpleCriterion = function singleSimpleCriterion(){
	// File: matcher.cpp lines: 184-196
	if (!this._expression)
		return false;

	if (this._expression.matchType() == MatchExpression.EQ)
		return true;

	if (this._expression.matchType() == MatchExpression.AND && this._expression.numChildren() == 1 && this._expression.getChild(0).matchType() == MatchExpression.EQ)
		return true;

	return false;
};

/**
 *
 * Wrapper around _spliceForIndex
 * @method spliceForIndex
 * @param key
 * @param full
 * @param spliceInfo
 *
 */
proto.spliceForIndex = function spliceForIndex(key, full, spliceInfo){
	// File: matcher.cpp lines: 209-217
	var keys = [],
		e, i;
	for (i in key) {
		e = key[i];
		keys.insert(e.fieldName());
	}
	return this._spliceForIndex(keys, full, spliceInfo);
};

/**
 *
 * Convert _pattern into a string
 * @method toString
 *
 */
proto.toString = function toString(){
	// File: matcher.h lines: 66-65
	return this._pattern.toString();
};
"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	ErrorCodes = require("../../../lib/errors").ErrorCodes,
	matcher = require("../../../lib/matcher/"),
	AllElemMatchOp = matcher.AllElemMatchOp,
	AndMatchExpression = matcher.AndMatchExpression,
	ElemMatchObjectMatchExpression = matcher.ElemMatchObjectMatchExpression,
	ElemMatchValueMatchExpression = matcher.ElemMatchValueMatchExpression,
	EqualityMatchExpression = matcher.EqualityMatchExpression,
	GTMatchExpression = matcher.GTMatchExpression,
	LTMatchExpression = matcher.LTMatchExpression;

exports.AllElemMatchOp = {

	"should match an element": function() {
		var baseOperanda1={"a":1},
			eqa1 = new EqualityMatchExpression();

		assert.strictEqual(eqa1.init("a", baseOperanda1.a).code, ErrorCodes.OK);

		var baseOperandb1={"b":1},
			eqb1 = new EqualityMatchExpression(),
			and1 = new AndMatchExpression(),
			elemMatch1 = new ElemMatchObjectMatchExpression();

		assert.strictEqual(eqb1.init("b", baseOperandb1.b).code, ErrorCodes.OK);

		and1.add(eqa1);
		and1.add(eqb1);
		// and1 = { a : 1, b : 1 }

		elemMatch1.init("x", and1);
		// elemMatch1 = { x : { $elemMatch : { a : 1, b : 1 } } }

		var baseOperanda2={"a":2},
			eqa2 = new EqualityMatchExpression();

		assert.strictEqual(eqa2.init("a", baseOperanda2.a).code, ErrorCodes.OK);

		var baseOperandb2={"b":2},
			eqb2 = new EqualityMatchExpression(),
			and2 = new AndMatchExpression(),
			elemMatch2 = new ElemMatchObjectMatchExpression(),
			op = new AllElemMatchOp();

		assert.strictEqual(eqb2.init("b", baseOperandb2.b).code, ErrorCodes.OK);

		and2.add(eqa2);
		and2.add(eqb2);

		elemMatch2.init("x", and2);
		// elemMatch2 = { x : { $elemMatch : { a : 2, b : 2 } } }

		op.init("");
		op.add(elemMatch1);
		op.add(elemMatch2);

		var nonArray={"x":4},
			emptyArray={"x":[]},
			nonObjArray={"x":[4]},
			singleObjMatch={"x":[{"a":1, "b":1}]},
			otherObjMatch={"x":[{"a":2, "b":2}]},
			bothObjMatch={"x":[{"a":1, "b":1}, {"a":2, "b":2}]},
			noObjMatch={"x":[{"a":1, "b":2}, {"a":2, "b":1}]};

		assert.ok(!op.matchesSingleElement(nonArray.x));
		assert.ok(!op.matchesSingleElement(emptyArray.x));
		assert.ok(!op.matchesSingleElement(nonObjArray.x));
		assert.ok(!op.matchesSingleElement(singleObjMatch.x));
		assert.ok(!op.matchesSingleElement(otherObjMatch.x));
		assert.ok(op.matchesSingleElement(bothObjMatch.x));
		assert.ok(!op.matchesSingleElement(noObjMatch.x));
	},

	"should match things": function() {
		var baseOperandgt1={"$gt":1},
			gt1 = new GTMatchExpression();

		assert.strictEqual(gt1.init("", baseOperandgt1.$gt).code, ErrorCodes.OK);

		var baseOperandlt1={"$lt":10},
			lt1 = new LTMatchExpression(),
			elemMatch1 = new ElemMatchValueMatchExpression();

		assert.strictEqual(lt1.init("", baseOperandlt1.$lt).code, ErrorCodes.OK);

		elemMatch1.init("x");
		elemMatch1.add(gt1);
		elemMatch1.add(lt1);

		var baseOperandgt2={"$gt":101},
			gt2 = new GTMatchExpression();

		assert.strictEqual(gt2.init("", baseOperandgt2.$gt).code, ErrorCodes.OK);

		var baseOperandlt2={"$lt":110},
			lt2 = new LTMatchExpression(),
			elemMatch2 = new ElemMatchValueMatchExpression(),
			op = new AllElemMatchOp();

		assert.strictEqual(lt2.init("", baseOperandlt2.$lt).code, ErrorCodes.OK);

		elemMatch2.init("x");
		elemMatch2.add(gt2);
		elemMatch2.add(lt2);

		op.init("x");
		op.add(elemMatch1);
		op.add(elemMatch2);


		var nonArray={"x":4},
			emptyArray={"x":[]},
			nonNumberArray={"x":["q"]},
			singleMatch={"x":[5]},
			otherMatch={"x":[105]},
			bothMatch={"x":[5,105]},
			neitherMatch={"x":[0,200]};

		assert.ok(!op.matches(nonArray, null));
		assert.ok(!op.matches(emptyArray, null));
		assert.ok(!op.matches(nonNumberArray, null));
		assert.ok(!op.matches(singleMatch, null));
		assert.ok(!op.matches(otherMatch, null));
		assert.ok(op.matches(bothMatch, null));
		assert.ok(!op.matches(neitherMatch, null));
	},

};
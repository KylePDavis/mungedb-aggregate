"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	FieldPathExpression = require("../../../../lib/pipeline/expressions/FieldPathExpression"),
	Variables = require("../../../../lib/pipeline/expressions/Variables"),
	DepsTracker = require("../../../../lib/pipeline/DepsTracker");

exports.FieldPathExpression = {

	".constructor()": {

		"should throw Error if empty field path": function testInvalid(){
			assert.throws(function() {
				new FieldPathExpression("");
			});
		},

	},

	"#evaluate()": {

		"should return undefined if field path is missing": function testMissing(){
			var expr = FieldPathExpression.create("a");
			assert.strictEqual(expr.evaluate({}), undefined);
		},

		"should return value if field path is present": function testPresent(){
			var expr = FieldPathExpression.create("a");
			assert.strictEqual(expr.evaluateInternal(new Variables(1, {a:123})), 123);
		},

		"should return undefined if field path is nested below null": function testNestedBelowNull(){
			var expr = FieldPathExpression.create("a.b");
			assert.strictEqual(expr.evaluateInternal(new Variables(1,{a:null})), undefined);
		},

		"should return undefined if field path is nested below undefined": function NestedBelowUndefined(){
			var expr = FieldPathExpression.create("a.b");
			assert.strictEqual(expr.evaluateInternal(new Variables(1,{a:undefined})), undefined);
		},

		"should return undefined if field path is nested below missing": function testNestedBelowMissing(){
			var expr = FieldPathExpression.create("a.b");
			assert.strictEqual(expr.evaluateInternal(new Variables(1,{z:1})), undefined);
		},

		"should return undefined if field path is nested below Number": function testNestedBelowInt(){
			var vars = new Variables(1,{a:2}),
				expr = FieldPathExpression.create("a.b"),
				results = expr.evaluateInternal(vars);
			assert.strictEqual(results, undefined);
		},

		"should return value if field path is nested": function testNestedValue(){
			var vars = new Variables(1,{a:{b:55}}),
				expr = FieldPathExpression.create("a.b"),
				results = expr.evaluateInternal(vars);
			assert.strictEqual(results, 55);
		},

		"should return undefined if field path is nested below empty Object": function testNestedBelowEmptyObject(){
			var vars = new Variables(1,{a:{}}),
				expr = FieldPathExpression.create("a.b"),
				results = expr.evaluateInternal(vars);
			assert.strictEqual(results, undefined);
		},

		"should return empty Array if field path is nested below empty Array": function testNestedBelowEmptyArray(){
			var vars = new Variables(1,{a:[]}),
				expr = FieldPathExpression.create("a.b"),
				results = expr.evaluateInternal(vars);
			assert.deepEqual(results, []);
		},
		"should return empty Array if field path is nested below Array containing null": function testNestedBelowArrayWithNull(){
			var vars = new Variables(1,{a:[null]}),
				expr = FieldPathExpression.create("a.b"),
				results = expr.evaluateInternal(vars);
			assert.deepEqual(results, []);
		},

		"should return empty Array if field path is nested below Array containing undefined": function testNestedBelowArrayWithUndefined(){
			var vars = new Variables(1,{a:[undefined]}),
				expr = FieldPathExpression.create("a.b"),
				results = expr.evaluateInternal(vars);
			assert.deepEqual(results, []);
		},

		"should return empty Array if field path is nested below Array containing a Number": function testNestedBelowArrayWithInt(){
			var vars = new Variables(1,{a:[9]}),
				expr = FieldPathExpression.create("a.b"),
				results = expr.evaluateInternal(vars);
			assert.deepEqual(results, []);
		},

		"should return Array with value if field path is in Object within Array": function testNestedWithinArray(){
			assert.deepEqual(FieldPathExpression.create("a.b").evaluateInternal(new Variables(1,{a:[{b:9}]})), [9]);
		},

		"should return Array with multiple values if field path is within Array and multiple matches": function testMultipleArrayValues(){
			var path = "a.b",
				doc = {a:[{b:9},null,undefined,{g:4},{b:20},{}]},
				expected = [9,20];
			assert.deepEqual(FieldPathExpression.create(path).evaluateInternal(new Variables(1,doc)), expected);
		},

		"should return Array with expanded values from nested multiple nested Arrays": function testExpandNestedArrays(){
			var path = "a.b.c",
				doc = {a:[{b:[{c:1},{c:2}]},{b:{c:3}},{b:[{c:4}]},{b:[{c:[5]}]},{b:{c:[6,7]}}]},
				expected = [[1,2],3,[4],[[5]],[6,7]];
			assert.deepEqual(FieldPathExpression.create(path).evaluateInternal(new Variables(1,doc)), expected);
		},

		"should return null if field path points to a null value": function testPresentNull(){
			assert.strictEqual(FieldPathExpression.create("a").evaluateInternal(new Variables(1,{a:null})), null);
		},

		"should return undefined if field path points to a undefined value": function testPresentUndefined(){
			assert.strictEqual(FieldPathExpression.create("a").evaluateInternal(new Variables(1,{a:undefined})), undefined);
		},

		"should return Number if field path points to a Number value": function testPresentNumber(){
			assert.strictEqual(FieldPathExpression.create("a").evaluateInternal(new Variables(1,{a:42})), 42);
		}

	},

	"#optimize()": {

		"should not optimize anything": function testOptimize(){
			var expr = FieldPathExpression.create("a");
			// An attempt to optimize returns the Expression itself.
			assert.strictEqual(expr, expr.optimize());
		},

	},

	"#addDependencies()": {

		"should return the field path itself as a dependency": function testDependencies(){
			var fpe = FieldPathExpression.create("a.b"),
				deps = new DepsTracker();
			fpe.addDependencies(deps);
			assert.strictEqual(Object.keys(deps.fields).length, 1);
			assert("a.b" in deps.fields);
			assert.strictEqual(deps.needWholeDocument, false);
			assert.strictEqual(deps.needTextScore, false);
		},

	},

	"#serialize()": {

		"should output path String with a '$'-prefix": function testJson(){
			assert.equal(FieldPathExpression.create("a.b.c").serialize(), "$a.b.c");
		},

	},


};
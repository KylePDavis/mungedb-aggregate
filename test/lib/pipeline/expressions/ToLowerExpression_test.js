"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	ToLowerExpression = require("../../../../lib/pipeline/expressions/ToLowerExpression"),
	VariablesParseState = require("../../../../lib/pipeline/expressions/VariablesParseState"),
	VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator"),
	Expression = require("../../../../lib/pipeline/expressions/Expression"),
	utils = require("./utils"),
	constify = utils.constify,
	expressionToJson = utils.expressionToJson;

var TestBase = function TestBase(overrides) {
		//NOTE: DEVIATION FROM MONGO: using this base class to make things easier to initialize
		for (var key in overrides) //jshint ignore:line
			this[key] = overrides[key];
	},
	ExpectedResultBase = (function() {
		var klass = function ExpectedResultBase() {
			base.apply(this, arguments);
		}, base = TestBase, proto = klass.prototype = Object.create(base.prototype);
		proto.run = function(){
			var specElement = this.spec(),
				idGenerator = new VariablesIdGenerator(),
				vps = new VariablesParseState(idGenerator),
				expr = Expression.parseOperand(specElement, vps);
			assert.deepEqual(constify(specElement), expressionToJson(expr));
			assert.strictEqual(this.expectedResult, expr.evaluate({}));
		};
		proto.spec = function() {
			return {$toLower:[this.str]};
		};
		return klass;
	})();

exports.ToLowerExpression = {

	"constructor()": {

		"should construct instance": function() {
			assert(new ToLowerExpression() instanceof ToLowerExpression);
			assert(new ToLowerExpression() instanceof Expression);
		},

		"should error if given args": function() {
			assert.throws(function() {
				new ToLowerExpression("bad stuff");
			});
		},

	},

	"#getOpName()": {

		"should return the correct op name; $toLower": function() {
			assert.equal(new ToLowerExpression().getOpName(), "$toLower");
		},

	},

	"#evaluate()": {

		"should return the lowercase version of the string if a null is character at the beginning of the string": function NullBegin() {
			/** String beginning with a null character. */
			new ExpectedResultBase({
				str: "\0aB",
				expectedResult: "\0ab",
			}).run();
		},

		"should return the lowercase version of the string if a null is character in the middle of the string": function NullMiddle() {
			/** String containing a null character. */
			new ExpectedResultBase({
				str: "a\0B",
				expectedResult: "a\0b",
			}).run();
		},

		"should return the lowercase version of the string if a null is character at the end of the string": function NullEnd() {
			/** String ending with a null character. */
			new ExpectedResultBase({
				str: "aB\0",
				expectedResult: "ab\0",
			}).run();
		},

	},

};
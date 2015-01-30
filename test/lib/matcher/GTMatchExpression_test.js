"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	BSON = require("bson"),
	ErrorCodes = require("../../../lib/errors").ErrorCodes,
	MatchDetails = require("../../../lib/matcher/MatchDetails"),
	GTMatchExpression = require("../../../lib/matcher/GTMatchExpression");


exports.GTMatchExpression = {

	"should handle invalid End of Object Operand": function() {
		var e = new GTMatchExpression();
		var s = e.init("",{});

		assert.strictEqual(s.code, ErrorCodes.BAD_VALUE);
	},

	"should match scalars":function() {
		var e = new GTMatchExpression();
		var s = e.init("a",5);

		assert.strictEqual(s.code, ErrorCodes.OK);
		assert.ok( e.matchesJSON({"a":5.5}) );
		assert.ok( ! e.matchesJSON({"a":4}) );
	},

	"should match array value": function() {
		var e = new GTMatchExpression();
		var s = e.init("a",5);

		assert.strictEqual(s.code, ErrorCodes.OK);
		assert.ok( e.matchesJSON({"a":[3,5.5]}) );
		assert.ok( ! e.matchesJSON({"a":[2,4]}) );
	},

	"should match whole array": function() {
		var e = new GTMatchExpression();
		var s = e.init("a",[5]);

		assert.strictEqual(s.code, ErrorCodes.OK);
		assert.ok( ! e.matchesJSON({"a":[4]}) );
		assert.ok( ! e.matchesJSON({"a":[5]}) );
		assert.ok( e.matchesJSON({"a":[6]}) );
		// Nested array.
		// XXX: The following assertion documents current behavior.
		assert.ok( e.matchesJSON({"a":[[4]]}) );
		assert.ok( e.matchesJSON({"a":[[5]]}) );
		assert.ok( e.matchesJSON({"a":[[6]]}) );
	},

	"should match null" : function() {
		var e = new GTMatchExpression();
		var s = e.init("a",null);

		assert.strictEqual(s.code, ErrorCodes.OK);
		assert.ok( !e.matchesJSON({}) );
		assert.ok( !e.matchesJSON({"a":null}) );
		assert.ok( ! e.matchesJSON({"a":4}) );
		// A non-existent field is treated same way as an empty bson object
		assert.ok( ! e.matchesJSON({"b":4}) );
	},

	"should match dot notation null" : function() {
		var e = new GTMatchExpression();
		var s = e.init("a.b",null);

		assert.strictEqual(s.code, ErrorCodes.OK);
		assert(!e.matchesJSON({}) );
		assert(!e.matchesJSON({"a":null}) );
		assert(!e.matchesJSON({"a":4}));
		assert(!e.matchesJSON({"a":{}}));
		assert(!e.matchesJSON({"a":[{b:null}]}));
		assert(!e.matchesJSON({"a":[{a:4},{b:4}]}));
		assert(!e.matchesJSON({"a":[4]}));
		assert(!e.matchesJSON({"a":[{b:4}]}));
	},

	"should match MinKey": function() {
		var operand = {a:new BSON.MinKey()},
			e = new GTMatchExpression();
		var s = e.init("a",operand.a);
		assert.strictEqual(s.code, ErrorCodes.OK);
		assert(!e.matchesJSON({"a":new BSON.MinKey()}, null));
		assert(e.matchesJSON({"a":new BSON.MaxKey()}, null));
		assert(e.matchesJSON({"a":4}), null);
	},

	"should match MaxKey": function() {
		var operand = {a:new BSON.MaxKey()},
			e = new GTMatchExpression();
		var s = e.init("a",operand.a);
		assert.strictEqual(s.code, ErrorCodes.OK);
		assert(!e.matchesJSON({"a":new BSON.MaxKey()}, null));
		assert(!e.matchesJSON({"a":new BSON.MinKey()}, null));
		assert(!e.matchesJSON({"a":4}), null);
	},

	"should handle elemMatchKey":function() {
		var e = new GTMatchExpression();
		var s = e.init("a",5);
		var m = new MatchDetails();
		m.requestElemMatchKey();
		assert.strictEqual(s.code, ErrorCodes.OK);

		assert(!e.matchesJSON({"a":4}, m));
		assert(!m.hasElemMatchKey());

		assert(e.matchesJSON({"a":6}, m) );
		assert(!m.hasElemMatchKey() );

		assert(e.matchesJSON({"a":[2,6,5]}, m));
		assert(m.hasElemMatchKey());
		assert.strictEqual("1", m.elemMatchKey());
	},

};
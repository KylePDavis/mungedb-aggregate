"use strict";
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	ErrorCodes = require("../../../lib/errors").ErrorCodes,
	MatchExpressionParser = require("../../../lib/matcher/MatchExpressionParser");


exports.MatchExpressionParser = {

	"should generate matchers that work with no operators": function() {
		var goodQ = {"x":2},badQ = {"x":3};
		var parser =  new MatchExpressionParser();
		var res = parser.parse(goodQ);
		assert.strictEqual(res.code,ErrorCodes.OK,res.description);
		assert.ok( res.result.matches(goodQ));
		assert.ok( ! res.result.matches(badQ));
	},

	"should parse {x:5,y:{$gt:5, :$lt:8}}": function() {
		var q = {"x":5, "y":{"$gt":5, "$lt":8}};
		var parser = new MatchExpressionParser();
		var res = parser.parse( q );
		assert.strictEqual(res.code,ErrorCodes.OK,res.description);
		assert.ok( res.result.matches({"x":5, "y":7}) );
		assert.ok( res.result.matches({"x":5, "y":6}) );
		assert.ok( ! res.result.matches({"x":6, "y":7}) );
		assert.ok( ! res.result.matches({"x":5, "y":9}) );
		assert.ok( ! res.result.matches({"x":5, "y":4}) );
	},

	"should parse $isolated and $atomic appropriately": function() {
		var q1 = {"x":5, "$atomic": {"$gt":5, "$lt":8}},
			q2 = {"x":5, "$isolated":1},
			q3 = {"x":5, "y":{"$isolated":1}};
		var parser = new MatchExpressionParser();
		parser.parse(q1);

		assert.strictEqual(parser.parse(q1).code, ErrorCodes.OK);
		assert.strictEqual(parser.parse(q2).code, ErrorCodes.OK);
		assert.strictEqual(parser.parse(q3).code, ErrorCodes.BAD_VALUE);
	},

	"should parse and match $size with an int": function() {
		var parser = new MatchExpressionParser();
		var q = {"x":{"$size":2}};

		var res = parser.parse(q);
		assert.strictEqual(res.code,ErrorCodes.OK,res.description);
		assert.ok( ! res.result.matches({"x":1}) );
		assert.ok( res.result.matches({"x":[1,2]}) );
		assert.ok( ! res.result.matches({"x":[1]}) );
		assert.ok( ! res.result.matches({"x":[1,2,3]}) );
	},

	"should parse and match $size with a string argument": function() {
		var parser = new MatchExpressionParser();
		var q = {"x":{"$size":"a"}};

		var res = parser.parse( q );
		assert.strictEqual(res.code,ErrorCodes.OK,res.description);
		assert.ok( ! res.result.matches({"x":1}) );
		assert.ok( ! res.result.matches({"x":[1,2]}) );
		assert.ok( res.result.matches({"x":[]}) );
		assert.ok( ! res.result.matches({"x": [1]}) );
	},

	"should parse and match $size with a float argument":function() {
		var parser = new MatchExpressionParser();
		var q = {"x": {"$size": 2.5}};

		var res = parser.parse( q );
		assert.strictEqual( res.code,ErrorCodes.OK,res.description );
		assert.ok( ! res.result.matches({"x":1}) );
		assert.ok( ! res.result.matches({"x":[1,2]}) );
		assert.ok( ! res.result.matches({"x":[]}) );
		assert.ok( ! res.result.matches({"x":[1,2,3]}) );
	},

	"should not accept  null": function() {
		var parser = new MatchExpressionParser();
		var q = {"x":{"$size":null}};

		var res = parser.parse( q );
		assert.strictEqual( res.code, ErrorCodes.BAD_VALUE );
	},

	"should parse $elemMatch : {x:1,y:2}": function() {
		var parser = new MatchExpressionParser();
		var q = {"x":{"$elemMatch": {"x":1,"y":2}}};

		var res = parser.parse( q );
		assert.strictEqual( res.code,ErrorCodes.OK,res.description );
		assert.ok( ! res.result.matches({"x":1}) );
		assert.ok( ! res.result.matches({"x":[1,2]}) );
		assert.ok( ! res.result.matches({"x":[{"x":1}]}) );
		assert.ok( res.result.matches({"x": [{"x":1,"y":2}]}) );
	},

	"should parse and match $elemMatch: {$gt:5}": function() {
		var parser = new MatchExpressionParser();
		var q = {"x": {"$elemMatch": {"$gt":5}}};

		var res = parser.parse( q );
		assert.strictEqual( res.code,ErrorCodes.OK,res.description );
		assert.ok( ! res.result.matches({"x":1}) );
		assert.ok( ! res.result.matches({"x":[4]}) );
		assert.ok( res.result.matches({"x":[6]}) );
	},

	"should parse and match $all:[1,2]" : function() {
		var parser = new MatchExpressionParser();
		var q = {"x":{"$all":[1,2]}};

		var res = parser.parse( q );
		assert.strictEqual( res.code,ErrorCodes.OK,res.description );
		assert.ok( ! res.result.matches({"x":1}) );
		assert.ok( ! res.result.matches({"x":[1]}) );
		assert.ok( ! res.result.matches({"x":[2]}) );
		assert.ok( res.result.matches({"x":[1,2]}) );
		assert.ok( res.result.matches({"x":[1,2,3]}) );
		assert.ok( ! res.result.matches({"x":[2,3]}) );
	},

	"should not allow $all to have an element argument": function() {
		var parser = new MatchExpressionParser();
		var q = {"x": {"$all":1}};

		var res = parser.parse( q );
		assert.strictEqual( res.code, ErrorCodes.BAD_VALUE );
	},

	"should not allow large regex patterns": function() {
		var parser = new MatchExpressionParser();
		var q = {"x":{"$all":[new RegExp((new Array(50*1000+1)).join("z"))] }};

		var res = parser.parse( q );
		assert.strictEqual( res.code, ErrorCodes.BAD_VALUE );
	},

	"should parse and match some simple regex patterns": function() {
		var parser = new MatchExpressionParser();
		var a = /^a/;
		var b = /B/i;
		var q = {"a": {"$all": [ a , b ]}};

		var res = parser.parse( q );
		assert.strictEqual( res.code,ErrorCodes.OK,res.description );
		assert.ok( ! res.result.matches({"a":"ax"}) );
		assert.ok( ! res.result.matches({"a":"qqb"}) );
		assert.ok( res.result.matches({"a":"ab"}) );
	},

	"should parse and match some more simple regexes" : function() {
		var parser = new MatchExpressionParser();
		var a = /^a/;
		var b = /abc/;
		var q = {"a": {"$all": [a, b]}};

		var res = parser.parse( q );
		assert.strictEqual( res.code,ErrorCodes.OK,res.description );
		assert.ok( ! res.result.matches({"a":"ax"}) );
		assert.ok( res.result.matches({"a":"abc"}) );
	},

	"should properly handle x:{$all:[5]}": function() {
		var parser = new MatchExpressionParser();
		var q = {"x":{"$all":[5]}};

		var res = parser.parse( q );
		assert.strictEqual( res.code,ErrorCodes.OK,res.description );
		assert.ok( res.result.matches({"x":5}) );
		assert.ok( res.result.matches({"x":[5]}) );
		assert.ok( ! res.result.matches({"x":4}) );
		assert.ok( ! res.result.matches({"x":[4]}) );
	},

	"should handle a good $all $elemMatch query": function() {
		var parser = new MatchExpressionParser();
		var q = {"x":{"$all":[{"$elemMatch": {"x":1,"y":2}}]}};

		var res = parser.parse( q );
		assert.strictEqual( res.code,ErrorCodes.OK,res.description );
		assert.ok( ! res.result.matches({"x":1}) );
		assert.ok( ! res.result.matches({"x":[1,2]}) );
		assert.ok( ! res.result.matches({"x":[{"x":1}]}) );
		assert.ok( res.result.matches({"x":[{"x":1,"y":2}]}) );
	},

	"should properly not parse bad $all $elemMatch queries": function() {
		var parser = new MatchExpressionParser();
		var q = {"x":{"$all":[{"$elemMatch":{"x":1,"y":2}}, 5]}};

		var res = parser.parse( q );
		assert.strictEqual( res.code, ErrorCodes.BAD_VALUE );

		q = {"x":{"$all":[5,{"$elemMatch":{"x":1,"y":2}}]}};
		res = parser.parse( q );
		assert.strictEqual( res.code, ErrorCodes.BAD_VALUE );
	},

	"should parse and match simple $eq": function() {
		var parser = new MatchExpressionParser();
		var q = {"x": {"$eq": 2}};

		var res = parser.parse( q );
		assert.strictEqual( res.code,ErrorCodes.OK,res.description );
		assert.ok( ! res.result.matches({"x":1}) );
		assert.ok( res.result.matches({"x":2}) );
		assert.ok( ! res.result.matches({"x":3}) );
	},

	"should parse and match simple $gt": function() {
		var parser = new MatchExpressionParser();
		var q = {"x": {"$gt":2}};

		var res = parser.parse( q );
		assert.strictEqual( res.code,ErrorCodes.OK,res.description );
		assert.ok( ! res.result.matches({"x":2}) );
		assert.ok( res.result.matches({"x":3}) );
	},

	"should parse and match a simple $lt": function() {
		var parser = new MatchExpressionParser();
		var q = {"x":{"$lt":2}};

		var res = parser.parse( q );
		assert.strictEqual( res.code,ErrorCodes.OK,res.description );
		assert.ok( res.result.matches({"x":1}) );
		assert.ok( ! res.result.matches({"x":2}) );
		assert.ok( ! res.result.matches({"x":3}) );
	},

	"should parse and match simple $gte": function() {
		var parser = new MatchExpressionParser();
		var q = {"x": {"$gte":2}};

		var res = parser.parse( q );
		assert.strictEqual( res.code,ErrorCodes.OK,res.description );
		assert.ok( ! res.result.matches({"x":1}) );
		assert.ok( res.result.matches({"x":2}) );
		assert.ok( res.result.matches({"x":3}) );
	},

	"should parse and matc simple $lte": function() {
		var parser = new MatchExpressionParser();
		var q = {"x": {"$lte":2}};

		var res = parser.parse( q );
		assert.strictEqual( res.code,ErrorCodes.OK,res.description );
		assert.ok( res.result.matches({"x":1}) );
		assert.ok( res.result.matches({"x":2}) );
		assert.ok( ! res.result.matches({"x":3}) );
	},

	"should parse and match simple $ne": function() {
		var parser = new MatchExpressionParser();
		var q = {"x": {"$ne":2}};

		var res = parser.parse( q );
		assert.strictEqual( res.code,ErrorCodes.OK,res.description );
		assert.ok( res.result.matches({"x":1}) );
		assert.ok( ! res.result.matches({"x":2}) );
		assert.ok( res.result.matches({"x":3}) );
	},

	"should parse simple $mod patterns":function() {
		var parser = new MatchExpressionParser();
		var q = {"x":{"$mod":[3,2]}};

		var res = parser.parse( q );
		assert.strictEqual( res.code,ErrorCodes.OK,res.description );

		q = {"x":{"$mod":[3]}};
		res = parser.parse( q );
		assert.strictEqual( res.code, ErrorCodes.BAD_VALUE );

		q = {"x":{"$mod":[3,2,4]}};
		res = parser.parse( q );
		assert.strictEqual( res.code, ErrorCodes.BAD_VALUE );

		q = {"x":{"$mod":["q",2]}};
		res = parser.parse( q );
		assert.strictEqual( res.code, ErrorCodes.BAD_VALUE );

		q = {"x":{"$mod":3}};
		res = parser.parse( q );
		assert.strictEqual( res.code, ErrorCodes.BAD_VALUE );

		q = {"x":{"$mod":{"a":1,"b":2}}};
		res = parser.parse( q );
		assert.strictEqual( res.code, ErrorCodes.BAD_VALUE );
	},

	"should parse and match simple $mod": function() {
		var parser = new MatchExpressionParser();
		var q = {"x":{"$mod":[3,2]}};

		var res = parser.parse( q );
		assert.strictEqual( res.code,ErrorCodes.OK,res.description );
		assert.ok( res.result.matches({"x":5}) );
		assert.ok( ! res.result.matches({"x":4}) );
		assert.ok( res.result.matches({"x":8}) );
	},

	"should parse and match a simple $in": function() {
		var parser = new MatchExpressionParser();
		var q = {"x": {"$in":[2,3]}};

		var res = parser.parse( q );
		assert.strictEqual( res.code,ErrorCodes.OK,res.description );
		assert.ok( ! res.result.matches({"x":1}) );
		assert.ok( res.result.matches({"x":2}) );
		assert.ok( res.result.matches({"x":3}) );
	},

	"should not accept a scalar as an arg to $in" : function() {
		var parser = new MatchExpressionParser();
		var q = {"x":{"$in": 5}};

		var res = parser.parse( q );
		assert.strictEqual( res.code, ErrorCodes.BAD_VALUE );
	},

	"should not accept an $elemMatch as an arg to an $in": function() {
		var parser = new MatchExpressionParser();
		var q = {"x":{"$in":[{"$elemMatch": 1}]}};

		var res = parser.parse( q );
		assert.strictEqual( res.code, ErrorCodes.BAD_VALUE );
	},

	"should not parse regexes that are too long": function() {
		var parser = new MatchExpressionParser();
		var str = (new Array(50*1000+1).join("z"));
		var q = {"x": {"$in":[new RegExp(str)]}};

		var res = parser.parse( q );
		assert.strictEqual( res.code, ErrorCodes.BAD_VALUE );

		q = {"x":{"$in": [{"$regex": str}]}};
		res = parser.parse( q );
		assert.strictEqual( res.code, ErrorCodes.BAD_VALUE );
	},

	"should parse and match $regex in an $in expression": function() {
		var parser = new MatchExpressionParser();
		var a = /^a/;
		var b = /B/i;
		var q = {"a": {"$in": [a,b,"2",4]}};

		var res = parser.parse( q );
		assert.strictEqual( res.code,ErrorCodes.OK,res.description );
		assert.ok( res.result.matches({"a":"ax"}) );
		assert.ok( res.result.matches({"a":/^a/}) );
		assert.ok( res.result.matches({"a":"qqb"}) );
		assert.ok( res.result.matches({"a":/B/i}) );
		assert.ok( res.result.matches({"a":4}) );
		assert.ok( ! res.result.matches({"a":"l"}) );
		assert.ok( ! res.result.matches({"a":/B/}) );
	},

	"should parse and match a simple $nin": function() {
		var parser = new MatchExpressionParser();
		var q = {"x": {"$nin": [2,3]}};

		var res = parser.parse( q );
		assert.strictEqual( res.code,ErrorCodes.OK,res.description );
		assert.ok( res.result.matches({"x":1}) );
		assert.ok( ! res.result.matches({"x":2}) );
		assert.ok( ! res.result.matches({"x":3}) );
	},

	"should not accept a scalar argument to $nin":function() {
		var parser = new MatchExpressionParser();
		var q = {"x":{$nin: 5}};

		var res = parser.parse( q );
		assert.strictEqual( res.code, ErrorCodes.BAD_VALUE );
	},

	"should properly handle /regex/i":function() {
		var parser = new MatchExpressionParser();
		var a = /abc/i;
		var q = {"x": a };

		var res = parser.parse( q );
		assert.strictEqual( res.code,ErrorCodes.OK,res.description );
		assert.ok( res.result.matches({"x":"ABC"}) );
		assert.ok( res.result.matches({"x":"abc"}) );
		assert.ok( ! res.result.matches({"x":"AC"}) );
	},

	"should properly handle $regex x $option i": function() {
		var parser = new MatchExpressionParser();
		var q = {"x": {"$regex": "abc", "$options":"i"}};

		var res = parser.parse( q );
		assert.strictEqual( res.code,ErrorCodes.OK,res.description );
		assert.ok( res.result.matches({"x":"abc"}) );
		assert.ok( res.result.matches({"x":"ABC"}) );
		assert.ok( ! res.result.matches({"x":"AC"}) );
	},

	"should properly handle $option i $regex x": function() {
		var parser = new MatchExpressionParser();
		var q = {"x":{"$options": "i", "$regex": "abc"}};

		var res = parser.parse( q );
		assert.strictEqual( res.code,ErrorCodes.OK,res.description );
		assert.ok( res.result.matches({"x":"abc"}) );
		assert.ok( res.result.matches({"x":"ABC"}) );
		assert.ok( ! res.result.matches({"x":"AC"}) );
	},

	"should not accept $optionas":function() {
		var parser = new MatchExpressionParser();
		var q = {"x":{"$regex":"abc", "$optionas":"i"}};

		var res = parser.parse( q );
		assert.strictEqual( res.code, ErrorCodes.BAD_VALUE );

		q = {"x":{"$optionas": "i"}};
		res = parser.parse( q );
		assert.strictEqual( res.code, ErrorCodes.BAD_VALUE );

		q = {"x":{"$options":"i"}};
		res = parser.parse( q );
		assert.strictEqual( res.code, ErrorCodes.BAD_VALUE );
	},

	"should parse and match $exist true": function() {
		var parser = new MatchExpressionParser();
		var q = {"x":{"$exists": true}};

		var res = parser.parse( q );
		assert.strictEqual( res.code,ErrorCodes.OK,res.description );
		assert.ok( res.result.matches({"x":"abc"}) );
		assert.ok( ! res.result.matches({"y":"AC"}) );
	},

	"should parse and match $exists false": function() {
		var parser = new MatchExpressionParser();
		var q = {"x":{"$exists":false}};

		var res = parser.parse( q );
		assert.strictEqual( res.code,ErrorCodes.OK,res.description );
		assert.ok( ! res.result.matches({"x":"abc"}) );
		assert.ok( res.result.matches({"y":"AC"}) );
	},

	"should parse and match String $type": function() {
		var parser = new MatchExpressionParser();
		var q = {"x":{"$type": 2 }};

		var res = parser.parse( q );
		assert.strictEqual( res.code,ErrorCodes.OK,res.description );
		assert.ok( res.result.matches({"x": "abc"}) );
		assert.ok( ! res.result.matches({"x": 2}) );
	},

	"should parse and match Number $type":function() {
		var parser = new MatchExpressionParser();
		var q = {"x":{"$type":1}};

		var res = parser.parse( q );
		assert.strictEqual( res.code,ErrorCodes.OK,res.description );
		assert.ok( res.result.matches({"x":2}) );
		assert.ok( ! res.result.matches({"x": "f"}) );
	},

	"should parse and match null $type" : function() {
		var parser = new MatchExpressionParser();
		var q = {"x":{"$type": 10}};

		var res = parser.parse( q );
		assert.strictEqual( res.code,ErrorCodes.OK,res.description );
		assert.ok( ! res.result.matches({"x":{}}) );
		assert.ok( ! res.result.matches({"x":5}) );
		assert.ok( res.result.matches({"x":null}) );
	},

	"should parse but not match a type beyond typemax in $type": function() {
		var parser = new MatchExpressionParser();
		var q = {"x":{"$type": 1000}};

		var res = parser.parse( q );
		assert.strictEqual( res.code,ErrorCodes.OK,res.description );
		assert.ok( ! res.result.matches({"x":5}) );
		assert.ok( ! res.result.matches({"x":"abc"}) );
	},

	"should not parse a $type: Object":function() {
		var parser = new MatchExpressionParser();
		var q = {"x":{"$type": {"x":1}}};

		var res = parser.parse( q );
		assert.strictEqual( res.code, ErrorCodes.BAD_VALUE );
	},

	"should parse and match a simple $or": function() {
		var parser = new MatchExpressionParser();
		var q = {"$or":[{"x":1},{"y":2}]};

		var res = parser.parse( q );
		assert.strictEqual( res.code,ErrorCodes.OK,res.description );
		assert.ok( res.result.matches({"x":1}) );
		assert.ok( res.result.matches({"y":2}) );
		assert.ok( ! res.result.matches({"x":3}) );
		assert.ok( ! res.result.matches({"y":1}) );
	},

	"should parse and match with nested $or s": function() {
		var parser = new MatchExpressionParser();
		var q = {"$or":[{"$or":[{"x":1},{"y":2}]}]};

		var res = parser.parse( q );
		assert.strictEqual( res.code,ErrorCodes.OK,res.description );
		assert.ok( res.result.matches({"x":1}) );
		assert.ok( res.result.matches({"y":2}) );
		assert.ok( ! res.result.matches({"x":3}) );
		assert.ok( ! res.result.matches({"y":1}) );
	},

	"should parse and match $and": function() {
		var parser = new MatchExpressionParser();
		var q = {"$and":[{"x":1},{"y":2}]};

		var res = parser.parse( q );
		assert.strictEqual( res.code,ErrorCodes.OK,res.description );
		assert.ok( ! res.result.matches({"x":1}) );
		assert.ok( ! res.result.matches({"y":2}) );
		assert.ok( ! res.result.matches({"x":3}) );
		assert.ok( ! res.result.matches({"y":1}) );
		assert.ok( res.result.matches({"x":1, "y":2}) );
		assert.ok( ! res.result.matches({"x":2, "y":2}) );
	},

	"should parse and match $nor": function() {
		var parser = new MatchExpressionParser();
		var q = {"$nor":[{"x":1},{"y":2}]};

		var res = parser.parse( q );
		assert.strictEqual( res.code,ErrorCodes.OK,res.description );
		assert.ok( ! res.result.matches({"x":1}) );
		assert.ok( ! res.result.matches({"y":2}) );
		assert.ok( res.result.matches({"x":3}) );
		assert.ok( res.result.matches({"y":1}) );
	},

	"should parse and match $not": function() {
		var parser = new MatchExpressionParser();
		var q = {"x":{"$not":{"$gt":5}}};

		var res = parser.parse( q );
		assert.strictEqual( res.code,ErrorCodes.OK,res.description );
		assert.ok( res.result.matches({"x":2}) );
		assert.ok( ! res.result.matches({"x":8}) );
	},

	"should allow trees less than the maximum recursion depth": function() {
		var parser = new MatchExpressionParser(),
			depth = 60,
			q = "",
			i;

		for (i = 0; i < depth/2; i++) {
			q = q + "{\"$and\": [{\"a\":3}, {\"$or\": [{\"b\":2},";
		}
		q = q + "{\"b\": 4}";
		for (i = 0; i < depth/2; i++) {
			q = q + "]}]}";
		}

		var res = parser.parse(JSON.parse(q));
		assert.strictEqual(res.code, ErrorCodes.OK, res.description);
	},

	"should error when depth limit is exceeded": function() {
		var parser = new MatchExpressionParser(),
			depth = 105,
			q = "",
			i;

		for (i = 0; i < depth/2; i++) {
			q = q + "{\"$and\": [{\"a\":3}, {\"$or\": [{\"b\":2},";
		}
		q = q + "{\"b\": 4}";
		for (i = 0; i < depth/2; i++) {
			q = q + "]}]}";
		}

		var res = parser.parse(JSON.parse(q));
		assert.strictEqual(res.description.substr(0, 43), "exceeded maximum query tree depth of 100 at");
		assert.strictEqual(res.code, ErrorCodes.BAD_VALUE);
	},

	"should error when depth limit is reached through a $not": function() {
		var parser = new MatchExpressionParser(),
			depth = 105,
			q = "{\"a\": ",
			i;

		for (i = 0; i < depth; i++) {
			q = q + "{\"$not\": ";
		}
		q = q + "{\"$eq\": 5}";
		for (i = 0; i < depth+1; i++) {
			q = q + "}";
		}

		var res = parser.parse(JSON.parse(q));
		assert.strictEqual(res.description.substr(0, 43), "exceeded maximum query tree depth of 100 at");
		assert.strictEqual(res.code, ErrorCodes.BAD_VALUE);
	},

	"should error when depth limit is reached through an $elemMatch": function() {
		var parser = new MatchExpressionParser(),
			depth = 105,
			q = "",
			i;

		for (i = 0; i < depth; i++) {
			q = q + "{\"a\": {\"$elemMatch\": ";
		}
		q = q + "{\"b\": 5}";
		for (i = 0; i < depth; i++) {
			q = q + "}}";
		}

		var res = parser.parse(JSON.parse(q));
		assert.strictEqual(res.description.substr(0, 43), "exceeded maximum query tree depth of 100 at");
		assert.strictEqual(res.code, ErrorCodes.BAD_VALUE);
	},

	"should parse $not $regex and match properly": function() {
		var parser = new MatchExpressionParser();
		var a = /abc/i;
		var q = {"x":{"$not": a}};
		var res = parser.parse( q );
		assert.strictEqual( res.code,ErrorCodes.OK,res.description );
		assert.ok( ! res.result.matches({"x":"abc"}) );
		assert.ok( ! res.result.matches({"x":"ABC"}) );
		assert.ok( res.result.matches({"x":"AC"}) );
	},

};

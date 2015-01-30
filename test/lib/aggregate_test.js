"use strict";
/*jshint camelcase:false*/
if (!module.parent) return require.cache[__filename] = 0, (new(require("mocha"))()).addFile(__filename).ui("exports").run(process.exit);
var assert = require("assert"),
	aggregate = require("../../");

// Utility to test the various use cases of `aggregate`
function testAggregate(opts){

	if (!opts.asyncOnly){
		// SYNC: test one-off usage
		var results = aggregate(opts.pipeline, opts.inputs).toArray();
		assert.equal(JSON.stringify(results), JSON.stringify(opts.expected));

		// SYNC: test one-off usage with context
		results = aggregate(opts.pipeline, {hi: "there"}, opts.inputs).toArray();
		assert.equal(JSON.stringify(results), JSON.stringify(opts.expected));

		// SYNC: test use with context
		var aggregator = aggregate(opts.pipeline, {hi: "there"});
		results = aggregator(opts.inputs).toArray();
		assert.equal(JSON.stringify(results), JSON.stringify(opts.expected));

		// SYNC: test reusable aggregator functionality
		aggregator = aggregate(opts.pipeline);
		results = aggregator(opts.inputs).toArray();
		assert.equal(JSON.stringify(results), JSON.stringify(opts.expected));

		// SYNC: test that it is actually reusable
		results = aggregator(opts.inputs).toArray();
		assert.equal(JSON.stringify(results), JSON.stringify(opts.expected), "should allow sync aggregator reuse");
	}
	// ASYNC: test one-off usage
	aggregate(opts.pipeline, opts.inputs, function(err, results){
		assert.ifError(err);
		assert.equal(JSON.stringify(results), JSON.stringify(opts.expected));

		// ASYNC: test one-off usage with context
		aggregate(opts.pipeline, {hi: "there"}, opts.inputs, function(err, results){
			assert.ifError(err);
			assert.equal(JSON.stringify(results), JSON.stringify(opts.expected));

			// ASYNC: test reusable aggregator functionality with context
			var aggregator = aggregate(opts.pipeline);
			aggregator({hi: "there"}, opts.inputs, function(err, results){
				assert.ifError(err);
				assert.equal(JSON.stringify(results), JSON.stringify(opts.expected));

				// ASYNC: test reusable aggregator functionality
				var aggregator = aggregate(opts.pipeline);
				aggregator(opts.inputs, function(err, results){
					assert.ifError(err);
					assert.equal(JSON.stringify(results), JSON.stringify(opts.expected));

					// ASYNC: test that it is actually reusable
					aggregator(opts.inputs, function(err, results){
						assert.ifError(err);
						assert.equal(JSON.stringify(results), JSON.stringify(opts.expected), "should allow async aggregator reuse");

						// success!
						return opts.next();
					});

				});

			});

		});

	});
}

exports.aggregate = {

	"should be able to use an empty pipeline (no-op)": function(next){
		testAggregate({
			inputs: [1, 2, 3],
			pipeline: [],
			expected: [1, 2, 3],
			next: next
		});
	},


	"should be able to use a limit operator": function(next){
		testAggregate({
			inputs: [{_id:0}, {_id:1}, {_id:2}, {_id:3}, {_id:4}, {_id:5}],
			pipeline: [{$limit:2}],
			expected: [{_id:0}, {_id:1}],
			next: next
		});
	},

	"should be able to use a match operator": function(next){
		testAggregate({
			inputs: [{_id:0, e:1}, {_id:1, e:0}, {_id:2, e:1}, {_id:3, e:0}, {_id:4, e:1}, {_id:5, e:0}],
			pipeline: [{$match:{e:1}}],
			expected: [{_id:0, e:1}, {_id:2, e:1}, {_id:4, e:1}],
			next: next
		});
	},

	"should be able to use a skip operator": function(next){
		testAggregate({
			inputs: [{_id:0}, {_id:1}, {_id:2}, {_id:3}, {_id:4}, {_id:5}],
			pipeline: [{$skip:2}, {$skip:1}],	//testing w/ 2 ensures independent state variables
			expected: [{_id:3}, {_id:4}, {_id:5}],
			next: next
		});
	},

	"should be able to use a skip and then a limit operator together in the same pipeline": function(next){
		testAggregate({
			inputs: [{_id:0, e:1}, {_id:1, e:0}, {_id:2, e:1}, {_id:3, e:0}, {_id:4, e:1}, {_id:5, e:0}],
			pipeline: [{$skip:2}, {$limit:1}],
			expected: [{_id:2, e:1}],
			next: next
		});
	},

	"should be able to construct an instance with unwind operators properly": function(next){
		testAggregate({
			inputs: [
				{_id:0, nodes:[
					{one:[11], two:[2,2]},
					{one:[1,1], two:[22]}
				]},
				{_id:1, nodes:[
					{two:[22], three:[333]},
					{one:[1], three:[3,3,3]}
				]}
			],
			pipeline: [{$unwind:"$nodes"}, {$unwind:"$nodes.two"}],
			expected: [
				{_id:0,nodes:{one:[11],two:2}},
				{_id:0,nodes:{one:[11],two:2}},
				{_id:0,nodes:{one:[1,1],two:22}},
				{_id:1,nodes:{two:22,three:[333]}}
			],
			next: next
		});
	},

	"should be able to use a project operator": function(next){
		// NOTE: Test case broken until expression is fixed
		testAggregate({
			inputs: [{_id:0, e:1, f:23}, {_id:2, e:2, g:34}, {_id:4, e:3}],
			pipeline: [
				{$project:{
					e:1,
					a:{$add:["$e", "$e"]},
					b:{$cond:[{$eq:["$e", 2]}, "two", "not two"]}
					//TODO: high level test of all other expression operators
				}}
			],
			expected: [{_id:0, e:1, a:2, b:"not two"}, {_id:2, e:2, a:4, b:"two"}, {_id:4, e:3, a:6, b:"not two"}],
			next: next
		});
	},


	"should be able to use a project operator to exclude the _id field": function(next){
		// NOTE: Test case broken until expression is fixed
		testAggregate({
			inputs: [{_id:0, e:1, f:23}, {_id:2, e:2, g:34}, {_id:4, e:3}],
			pipeline: [
				{$project:{
					_id:0,
					e:1
					//TODO: high level test of all other expression operators
				}}
			],
			expected: [{e:1}, {e:2}, {e:3}],
			next: next
		});
	},

	"should be able to project out a whole document and leave an empty": function(next) {
		testAggregate({
			inputs: [{_id:0, a:1}, {_id:1, a:2, b:1}, {_id:2, b:2, c:1}],
			pipeline: [
				{$project:{
					_id:0,
					a:1
					//TODO: high level test of all other expression operators
				}}
			],
			expected: [{a:1}, {a:2}, {}],
			next: next
		});
	},

	"should be able to construct an instance with sort operators properly (ascending)": function(next){
		testAggregate({
			asyncOnly: true, //TODO: fix this once sync mode is fixed again -- EAGLESIX-5093
			inputs: [
				{_id:3.14159}, {_id:-273.15},
				{_id:42}, {_id:11}, {_id:1},
				{_id:null}, {_id:NaN}
			],
			pipeline: [{$sort:{_id:1}}],
			expected: [
				{_id:null}, {_id:NaN},
				{_id:-273.15}, {_id:1}, {_id:3.14159}, {_id:11}, {_id:42}
			],
			next: next
		});
	},

	"should be able to construct an instance with $group operators properly": function(next){
		testAggregate({
			asyncOnly: true, //TODO: fix this once sync mode is fixed again -- EAGLESIX-5093
			inputs: [
				{_id:0, a:1},
				{_id:0, a:2},
				{_id:0, a:3},
				{_id:0, a:4},
				{_id:0, a:1.5},
				{_id:0, a:null},
				{_id:1, b:"a"},
				{_id:1, b:"b"},
				{_id:1, b:"b"},
				{_id:1, b:"c"}
			],
			pipeline:[
				{$group:{
					_id:"$_id",
					sum_a:{$sum:"$a"},
					//min_a:{$min:"$a"}, //this is busted in this version of mongo
					max_a:{$max:"$a"},
					avg_a:{$avg:"$a"},
					first_b:{$first:"$b"},
					last_b:{$last:"$b"},
					addToSet_b:{$addToSet:"$b"},
					push_b:{$push:"$b"}
				}}
			],
			expected: [
				{
					_id:0,
					sum_a:11.5,
					//min_a:1,
					max_a:4,
					avg_a:2.3,
					first_b:null,
					last_b:null,
					addToSet_b:[],
					push_b:[]
				},
				{
					_id:1,
					sum_a:0,
					//min_a:null,
					max_a:null,
					avg_a:0,
					first_b:"a",
					last_b:"c",
					addToSet_b:["a", "b", "c"],
					push_b:["a", "b", "b", "c"]
				}
			],
			next: next
		});
	},

	"should be able to construct an instance with $group using concat": function(next){
		testAggregate({
			asyncOnly: true, //TODO: fix this once sync mode is fixed again -- EAGLESIX-5093
			inputs: [
				{_id:0, a:null},
				{_id:1, a:"a"},
				{_id:1, a:"b"},
				{_id:1, a:"b"},
				{_id:1, a:"c"}
			],
			pipeline: [
				{$group:{
					_id:{$concat:["$a"]}
				}}
			],
			expected: [
				{_id: null},
				{_id: "a"},
				{_id: "b"},
				{_id: "c"}
			],
			next: next
		});
	},

	"should be able to successfully use comparisions of objects to nulls without throwing an exception": function(next){
		testAggregate({
			inputs: [
				{
					cond:{$or:[
						{$eq:["$server","Starmetal.demo.com"]},
					]},
					value:"PII"
				},
				{
					cond:{$or:[
						{$eq:["$server","Specium.demo.com"]},
						{$eq:["$server","Germanium.demo.com"]},
						{$eq:["$server","Runite.demo.com"]}
					]},
					value:"PI"
				},
				{
					cond:{$or:[
						{$eq:["$server","Primal.demo.com"]}
					]},
					value:"Confidential"
				},
				{
					cond:{$or:[
						{$eq:["$server","Polarite.demo.com"]},
						{$eq:["$server","Ryanium.demo.com"]}
					]},
					value:"Proprietary"
				},
				{
					cond:{$or:[
						{$eq:["$server","Phazon.demo.com"]}
					]},
					value:"PHI"
				},
				{
					cond:null,
					value:"Authorized"
				}
			],
			pipeline: [
				{$skip:1},
				{$limit:1},
				{$project:{
					retValue:{$cond:[
						{$ne:["$cond", null]},
						null,
						"$value"
					]}
				}}
			],
			expected: [{"retValue":null}],
			next: next
		});
	},

	"should be able to successfully compare a null to a null": function(next){
		testAggregate({
			inputs: [
				{
					cond:null,
					value:"Authorized"
				}
			],
			pipeline: [
				{$project:{
					retValue:{$cond:[
						{$eq:["$cond", null]},
						"$value",
						null
					]}
				}}
			],
			expected: [{"retValue":"Authorized"}],
			next: next
		});
	},

	"should be able to handle a large array of inputs (async only, sync will crash)": function(next) {
		this.timeout(10000);
		var inputs = [],
			expected = [];
		for(var i = 0; i < 10000; i++){
			inputs.push({a:i, b:[i,i,i,i,i]});
			expected.push({foo:i, bar:i});
			expected.push({foo:i, bar:i});
			expected.push({foo:i, bar:i});
			expected.push({foo:i, bar:i});
			expected.push({foo:i, bar:i});
		}
		testAggregate({
			asyncOnly: true, //TODO: fix this once sync mode is fixed again -- EAGLESIX-5093
			inputs: inputs,
			pipeline: [
				{$unwind:"$b"},
				{$project:{
					foo: "$a",
					bar: "$b",
				}},
			],
			expected: expected,
			next: next
		});
	},

	"should be able to explain an empty pipeline": function(){
		var pipeline = [],
			expected = [],
			actual = aggregate({
				pipeline: pipeline,
				explain: true
			});
		assert.deepEqual(actual, expected);
	},

	"should be able to explain a full pipeline": function(){
		var pipeline = [
				{$match:{e:1}},
				{$match:{d:1}},
				{$skip:2},
				{$limit:1},
				{$project:{
					foo: "$a"
				}},
				{$group:{
					_id:{$concat:["$foo"]}
				}}
			],
			expected = [
				{$match:{$and:[{e:1},{d:1}]}},
				{$limit:3},
				{$skip:2},
				{$project:{
					foo: "$a"
				}},
				{$group:{
					_id:{$concat:["$foo"]}
				}}
			],
			actual = aggregate({
				pipeline: pipeline,
				explain: true
			});
		assert.deepEqual(actual, expected);
	},

	"should be able to explain a full pipeline with inputs": function(){
		var pipeline = [
				{$match:{e:1}},
				{$match:{d:1}},
				{$skip:2},
				{$limit:1},
				{$project:{
					foo: "$a"
				}},
				{$group:{
					_id:{$concat:["$foo"]}
				}}
			],
			expected = [
				{"$cursor":{
					"query":{"$and":[{"e":1},{"d":1}]},
					"fields":{"a":1,"_id":1},
					"plan":{
						"type":"ArrayRunner",
						"nDocs":1,
						"position":0,
						"state":"RUNNER_ADVANCED"
					}
				}},
				{"$match":{"$and":[{"e":1},{"d":1}]}},
				{"$limit":3},
				{"$skip":2},
				{"$project":{"foo":"$a"}},
				{"$group":{"_id":{"$concat":["$foo"]}}}
			],
			actual = aggregate({
				pipeline: pipeline,
				explain: true
			}, [{e:1,d:2,a:4}]);
		assert.deepEqual(actual, expected);
	},

	"should throw parse errors if called sync-ly": function(){
		assert.throws(function(){
			aggregate([{"$project":{"foo":"bar"}}], [{"bar":1}]);
		});
		assert.throws(function(){
			aggregate([{"$project":{"foo":"bar"}}]);
		});
	},

	"should return parse errors in the callback if called async-ly": function(done){
		aggregate([{"$project":{"foo":"bar"}}], [{"bar":1}], function(err, results){
			assert(err, "Expected Error");
			done();
		});
	},

	"should throw pipeline errors if called sync-ly": function(){
		assert.throws(function(){
			aggregate([{"$project":{"sum":{"$add":["$foo", "$bar"]}}}], [{"foo":1, "bar":"baz"}]).toArray();
		});

		var agg = aggregate([{"$project":{"sum":{"$add":["$foo", "$bar"]}}}]);
		assert.throws(function(){
			agg([{"foo":1, "bar":"baz"}]).toArray();
		});
		assert.doesNotThrow(function(){
			agg([{"foo":1, "bar":2}]).toArray();
		});
	},

	"should return pipeline errors in the callback if called async-ly": function(done){
		aggregate([{"$project":{"sum":{"$add":["$foo", "$bar"]}}}], [{"foo":1, "bar":"baz"}], function(err, results){
			assert(err, "Expected Error");
			var agg = aggregate([{"$project":{"sum":{"$add":["$foo", "$bar"]}}}]);
			agg([{"foo":1, "bar":"baz"}], function(err, results){
				assert(err, "Expected Error");
				agg([{"foo":1, "bar":2}], function(err, results){
					assert.ifError(err, "UnExpected Error");
					done();
				});
			});
		});
	},

	"should be able to each over a cursor": function(done) {
		var docs = [{a:1}, {a:2}, {a:3}],
			expected = docs.slice(0,2),
			counter = 0,
			iterator = function(err, doc) {
				assert.ifError(err);
				assert.deepEqual(doc, expected[counter++]);
				if (doc === null) return done();
			};
		expected.push(null);
		aggregate([{$limit:2}], docs).each(iterator);
	},

	"should be able to forEach over a cursor": function(done) {
		var docs = [{a:1}, {a:2}, {a:3}],
			expected = docs.slice(0,2),
			counter = 0,
			iterator = function(doc) {
				assert.deepEqual(doc, expected[counter++]);
			},
			callback = function(err) {
				assert.ifError(err);
				done();
			};
		aggregate([{$limit:2}], docs).forEach(iterator, callback);
	},

};
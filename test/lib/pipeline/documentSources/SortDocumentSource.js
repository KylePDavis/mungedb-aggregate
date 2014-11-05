"use strict";
var assert = require("assert"),
	async = require("async"),
	DocumentSource = require("../../../../lib/pipeline/documentSources/DocumentSource"),
	SortDocumentSource = require("../../../../lib/pipeline/documentSources/SortDocumentSource"),
	LimitDocumentSource = require("../../../../lib/pipeline/documentSources/LimitDocumentSource"),
	CursorDocumentSource = require("../../../../lib/pipeline/documentSources/CursorDocumentSource"),
	Cursor = require("../../../../lib/Cursor"),
	FieldPathExpression = require("../../../../lib/pipeline/expressions/FieldPathExpression");


module.exports = {

	"SortDocumentSource": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor(){
				assert.doesNotThrow(function(){
					new SortDocumentSource();
				});
			}

		},

		"#getSourceName()": {

			"should return the correct source name; $sort": function testSourceName(){
				var sds = new SortDocumentSource();
				assert.strictEqual(sds.getSourceName(), "$sort");
			}

		},

		"#getFactory()": {

			"should return the constructor for this class": function factoryIsConstructor(){
				assert.strictEqual(new SortDocumentSource().getFactory(), SortDocumentSource);
			}

		},

		"#getNext()": {
			/** Assert that iterator state accessors consistently report the source is exhausted. */
			"should return EOF if there are no more sources": function noSources(next){
				var cwc = new CursorDocumentSource.CursorWithContext();
				cwc._cursor = new Cursor( [{"a": 1}] );
				var cds = new CursorDocumentSource(cwc);
				var sds = SortDocumentSource.createFromJson({"sort":1});
				sds.setSource(cds);
				sds.getNext(function(err, val) {
					assert.deepEqual(val, {a:1});
					sds.getNext(function(err, val) {
						assert.equal(val, DocumentSource.EOF);
						return next();
					});
				});
			},

			"should return EOF if there are more documents": function hitSort(next){
				var cwc = new CursorDocumentSource.CursorWithContext();
				cwc._cursor = new Cursor( [{a: 1}] );
				var cds = new CursorDocumentSource(cwc);
				var sds = SortDocumentSource.createFromJson({"sort":1});
				sds.setSource(cds);
				sds.getNext(function(err, doc) {
					assert.notEqual(doc, DocumentSource.EOF);
					next();
				});
			},

			"should return the current document source": function currSource(next){
				var cwc = new CursorDocumentSource.CursorWithContext();
				cwc._cursor = new Cursor( [{a: 1}] );
				var cds = new CursorDocumentSource(cwc);
				var sds = SortDocumentSource.createFromJson({"sort":1});
				sds.setSource(cds);
				sds.getNext(function(err, doc) {
					assert.deepEqual(doc, { a:1 });
					next();
				});
			},

			"should return next document when moving to the next source sorted descending": function nextSource(next){
				var cwc = new CursorDocumentSource.CursorWithContext();
				cwc._cursor = new Cursor( [{a: 1}, {b:2}] );
				var cds = new CursorDocumentSource(cwc);
				var sds = SortDocumentSource.createFromJson({"sort":-1});
				sds.setSource(cds);
				sds.getNext(function(err, doc) {
					assert.deepEqual(doc, {b:2});
					return next();
				});
			},

			"should return false for no sources remaining sorted descending": function noMoar(next){
				var cwc = new CursorDocumentSource.CursorWithContext();
				cwc._cursor = new Cursor( [{a: 1}, {b:2}] );
				var cds = new CursorDocumentSource(cwc);
				var sds = SortDocumentSource.createFromJson({"sort":-1});
				sds.setSource(cds);
				sds.getNext(function(err, doc) {
					sds.getNext(function(err, doc) {
						assert.deepEqual(doc, {a:1});
						next();
					});
				});
			}

		},

		"#serialize()": {

			"should throw an error when trying to serialize": function serialize() {
				var sds = new SortDocumentSource();
				assert.throws(sds.serialize.bind(sds));
			}

		},

		"#serializeToArray()": {

			/**
            * Check that the BSON representation generated by the souce matches the BSON it was
            * created with.
            */
            "should have equal json representation": function serializeToArrayCheck(){
				var spec = {"sort":1};
				var sds = new SortDocumentSource.createFromJson(spec, {});

				var array = [];
				sds.serializeToArray(array, false);
				assert.deepEqual(array, [ { '$sort': { '[object Object]': 1 } } ]);
			},

			"should create an object representation of the SortDocumentSource": function serializeToArrayTest(){
				var sds = new SortDocumentSource();
				var fieldPathVar;
				sds.vSortKey.push(new FieldPathExpression("b", fieldPathVar) );
				var array = [];
				sds.serializeToArray(array, false);
				assert.deepEqual(array,  [{"$sort":{"[object Object]":-1}}] );
			}

		},

		// "#createFromJson()": {

		// 	"should return a new SortDocumentSource object from an input JSON object": function createTest(){
		// 		var sds = SortDocumentSource.createFromJson({a:1});
		// 		assert.strictEqual(sds.constructor, SortDocumentSource);
		// 		var t = [];
		// 		sds.serializeToArray(t, false);
		// 		assert.deepEqual(t, [{ "$sort": { "a": 1 } }]);
		// 	},

		// 	"should return a new SortDocumentSource object from an input JSON object with a descending field": function createTest(){
		// 		var sds = SortDocumentSource.createFromJson({a:-1});
		// 		assert.strictEqual(sds.constructor, SortDocumentSource);
		// 		var t = [];
		// 		sds.serializeToArray(t, false);
		// 		assert.deepEqual(t, [{ "$sort": { "a": -1 } }]);
		// 	},

		// 	"should return a new SortDocumentSource object from an input JSON object with dotted paths": function createTest(){
		// 		var sds = SortDocumentSource.createFromJson({ "a.b":1 });
		// 		assert.strictEqual(sds.constructor, SortDocumentSource);
		// 		var t = [];
		// 		sds.serializeToArray(t, false);
		// 		assert.deepEqual(t, [{ "$sort": { "a.b" : 1  } }]);
		// 	},

		// 	"should throw an exception when not passed an object": function createTest(){
		// 		assert.throws(function() {
		// 			var sds = SortDocumentSource.createFromJson(7);
		// 		});
		// 	},

		// 	"should throw an exception when passed an empty object": function createTest(){
		// 		assert.throws(function() {
		// 			var sds = SortDocumentSource.createFromJson({});
		// 		});
		// 	},

		// 	"should throw an exception when passed an object with a non number value": function createTest(){
		// 		assert.throws(function() {
		// 			var sds = SortDocumentSource.createFromJson({a:"b"});
		// 		});
		// 	},

		// 	"should throw an exception when passed an object with a non valid number value": function createTest(){
		// 		assert.throws(function() {
		// 			var sds = SortDocumentSource.createFromJson({a:14});
		// 		});
		// 	}

		// },

		// "#sort": {

		// 	"should sort a single document": function singleValue(next) {
		// 		var cwc = new CursorDocumentSource.CursorWithContext();
		// 		cwc._cursor = new Cursor( [{_id:0, a: 1}] );
		// 		var cds = new CursorDocumentSource(cwc);
		// 		var sds = new SortDocumentSource();
		// 		sds.addKey("_id", false);
		// 		sds.setSource(cds);
		// 		sds.getNext(function(err, actual) {
		// 			assert.deepEqual(actual, {_id:0, a:1});
		// 			next();
		// 		});
		// 	},

		// 	"should sort two documents": function twoValue(next) {
		// 		var cwc = new CursorDocumentSource.CursorWithContext();
		// 		var l = [{_id:0, a: 1}, {_id:1, a:0}];
		// 		cwc._cursor = new Cursor( l );
		// 		var cds = new CursorDocumentSource(cwc);
		// 		var sds = new SortDocumentSource();
		// 		sds.addKey("_id", false);
		// 		sds.setSource(cds);

		// 		async.series([
		// 				sds.getNext.bind(sds),
		// 				sds.getNext.bind(sds),
		// 			],
		// 			function(err,res) {
		// 				assert.deepEqual([{_id:1, a: 0}, {_id:0, a:1}], res);
		// 				next();
		// 			}
		// 		);
		// 	},

		// 	"should sort two documents in ascending order": function ascendingValue(next) {
		// 		var cwc = new CursorDocumentSource.CursorWithContext();
		// 		var l = [{_id:0, a: 1}, {_id:5, a:12}, {_id:1, a:0}];
		// 		cwc._cursor = new Cursor( l );
		// 		var cds = new CursorDocumentSource(cwc);
		// 		var sds = new SortDocumentSource();
		// 		sds.addKey("_id", true);
		// 		sds.setSource(cds);

		// 		var docs = [], i = 0;
		// 		async.doWhilst(
		// 			function(cb) {
		// 				sds.getNext(function(err, val) {
		// 					docs[i] = val;
		// 					return cb(err);
		// 				});
		// 			},
		// 			function() {
		// 				return docs[i++] !== DocumentSource.EOF;
		// 			},
		// 			function(err) {
		// 				assert.deepEqual([{_id:0, a: 1}, {_id:1, a:0}, {_id:5, a:12}, DocumentSource.EOF], docs);
		// 				next();
		// 			}
		// 		);
		// 	},

		// 	"should sort documents with a compound key": function compoundKeySort(next) {
		// 		var cwc = new CursorDocumentSource.CursorWithContext();
		// 		var l = [{_id:0, a: 1, b:3}, {_id:5, a:12, b:7}, {_id:1, a:0, b:2}];
		// 		cwc._cursor = new Cursor( l );
		// 		var cds = new CursorDocumentSource(cwc);
		// 		var sds = new SortDocumentSource();
		// 		sds.addKey("a", false);
		// 		sds.addKey("b", false);
		// 		sds.setSource(cds);

		// 		var docs = [], i = 0;
		// 		async.doWhilst(
		// 			function(cb) {
		// 				sds.getNext(function(err, val) {
		// 					docs[i] = val;
		// 					return cb(err);
		// 				});
		// 			},
		// 			function() {
		// 				return docs[i++] !== DocumentSource.EOF;
		// 			},
		// 			function(err) {
		// 				assert.deepEqual([{_id:5, a:12, b:7}, {_id:0, a:1, b:3}, {_id:1, a:0, b:2}, DocumentSource.EOF], docs);
		// 				next();
		// 			}
		// 		);
		// 	},

		// 	"should sort documents with a compound key in ascending order": function compoundAscendingKeySort(next) {
		// 		var cwc = new CursorDocumentSource.CursorWithContext();
		// 		var l = [{_id:0, a: 1, b:3}, {_id:5, a:12, b:7}, {_id:1, a:0, b:2}];
		// 		cwc._cursor = new Cursor( l );
		// 		var cds = new CursorDocumentSource(cwc);
		// 		var sds = new SortDocumentSource();
		// 		sds.addKey("a", true);
		// 		sds.addKey("b", true);
		// 		sds.setSource(cds);

		// 		var docs = [], i = 0;
		// 		async.doWhilst(
		// 			function(cb) {
		// 				sds.getNext(function(err, val) {
		// 					docs[i] = val;
		// 					return cb(err);
		// 				});
		// 			},
		// 			function() {
		// 				return docs[i++] !== DocumentSource.EOF;
		// 			},
		// 			function(err) {
		// 				assert.deepEqual([{_id:1, a:0, b:2}, {_id:0, a:1, b:3}, {_id:5, a:12, b:7}, DocumentSource.EOF], docs);
		// 				next();
		// 			}
		// 		);
		// 	},

		// 	"should sort documents with a compound key in mixed order": function compoundMixedKeySort(next) {
		// 		var cwc = new CursorDocumentSource.CursorWithContext();
		// 		var l = [{_id:0, a: 1, b:3}, {_id:5, a:12, b:7}, {_id:1, a:0, b:2}, {_id:8, a:7, b:42}];
		// 		cwc._cursor = new Cursor( l );
		// 		var cds = new CursorDocumentSource(cwc);
		// 		var sds = new SortDocumentSource();
		// 		sds.addKey("a", true);
		// 		sds.addKey("b", false);
		// 		sds.setSource(cds);

		// 		var docs = [], i = 0;
		// 		async.doWhilst(
		// 			function(cb) {
		// 				sds.getNext(function(err, val) {
		// 					docs[i] = val;
		// 					return cb(err);
		// 				});
		// 			},
		// 			function() {
		// 				return docs[i++] !== DocumentSource.EOF;
		// 			},
		// 			function(err) {
		// 				assert.deepEqual([{_id:1, a:0, b:2}, {_id:0, a:1, b:3}, {_id:8, a:7, b:42}, {_id:5, a:12, b:7}, DocumentSource.EOF], docs);
		// 				next();
		// 			}
		// 		);
		// 	},

		// 	"should not sort different types": function diffTypesSort() {
		// 		var cwc = new CursorDocumentSource.CursorWithContext();
		// 		var l = [{_id:0, a: 1}, {_id:1, a:"foo"}];
		// 		cwc._cursor = new Cursor( l );
		// 		var cds = new CursorDocumentSource(cwc);
		// 		var sds = new SortDocumentSource();
		// 		sds.addKey("a", false);
		// 		assert.throws(sds.setSource(cds));
		// 	},

		// 	"should sort docs with missing fields": function missingFields(next) {
		// 		var cwc = new CursorDocumentSource.CursorWithContext();
		// 		var l = [{_id:0, a: 1}, {_id:1}];
		// 		cwc._cursor = new Cursor( l );
		// 		var cds = new CursorDocumentSource(cwc);
		// 		var sds = new SortDocumentSource();
		// 		sds.addKey("a", true);
		// 		sds.setSource(cds);

		// 		var docs = [], i = 0;
		// 		async.doWhilst(
		// 			function(cb) {
		// 				sds.getNext(function(err, val) {
		// 					docs[i] = val;
		// 					return cb(err);
		// 				});
		// 			},
		// 			function() {
		// 				return docs[i++] !== DocumentSource.EOF;
		// 			},
		// 			function(err) {
		// 				assert.deepEqual([{_id:1}, {_id:0, a:1}, DocumentSource.EOF], docs);
		// 				next();
		// 			}
		// 		);
		// 	},

		// 	"should sort docs with null fields": function nullFields(next) {
		// 		var cwc = new CursorDocumentSource.CursorWithContext();
		// 		var l = [{_id:0, a: 1}, {_id:1, a: null}];
		// 		cwc._cursor = new Cursor( l );
		// 		var cds = new CursorDocumentSource(cwc);
		// 		var sds = new SortDocumentSource();
		// 		sds.addKey("a", true);
		// 		sds.setSource(cds);

		// 		var docs = [], i = 0;
		// 		async.doWhilst(
		// 			function(cb) {
		// 				sds.getNext(function(err, val) {
		// 					docs[i] = val;
		// 					return cb(err);
		// 				});
		// 			},
		// 			function() {
		// 				return docs[i++] !== DocumentSource.EOF;
		// 			},
		// 			function(err) {
		// 				assert.deepEqual([{_id:1, a:null}, {_id:0, a:1}, DocumentSource.EOF], docs);
		// 				next();
		// 			}
		// 		);
		// 	},

		// 	"should not support a missing object nested in an array": function missingObjectWithinArray() {
		// 		var cwc = new CursorDocumentSource.CursorWithContext();
		// 		var l = [{_id:0, a: [1]}, {_id:1, a:[0]}];
		// 		cwc._cursor = new Cursor( l );
		// 		var cds = new CursorDocumentSource(cwc);
		// 		var sds = new SortDocumentSource();
		// 		assert.throws(function() {
		// 			sds.addKey("a.b", false);
		// 			sds.setSource(cds);
		// 			var c = [];
		// 			while (!sds.eof()) {
		// 				c.push(sds.getCurrent());
		// 				sds.advance();
		// 			}
		// 		});
		// 	},

		// 	"should compare nested values from within an array": function extractArrayValues(next) {
		// 		var cwc = new CursorDocumentSource.CursorWithContext();
		// 		var l = [{_id:0,a:[{b:1},{b:2}]}, {_id:1,a:[{b:1},{b:1}]} ];
		// 		cwc._cursor = new Cursor( l );
		// 		var cds = new CursorDocumentSource(cwc);
		// 		var sds = new SortDocumentSource();
		// 		sds.addKey("a.b", true);
		// 		sds.setSource(cds);

		// 		var docs = [], i = 0;
		// 		async.doWhilst(
		// 			function(cb) {
		// 				sds.getNext(function(err, val) {
		// 					docs[i] = val;
		// 					return cb(err);
		// 				});
		// 			},
		// 			function() {
		// 				return docs[i++] !== DocumentSource.EOF;
		// 			},
		// 			function(err) {
		// 				assert.deepEqual([{_id:1,a:[{b:1},{b:1}]},{_id:0,a:[{b:1},{b:2}]}, DocumentSource.EOF], docs);
		// 				next();
		// 			}
		// 		);
		// 	}

		// },

		// "#coalesce()": {
		// 	"should return false when coalescing a non-limit source": function nonLimitSource() {
		// 		var cwc = new CursorDocumentSource.CursorWithContext();
		// 		var l = [{_id:0,a:[{b:1},{b:2}]}, {_id:1,a:[{b:1},{b:1}]} ];
		// 		cwc._cursor = new Cursor( l );
		// 		var cds = new CursorDocumentSource(cwc),
		// 			sds = SortDocumentSource.createFromJson({a:1});

		// 		var newSrc = sds.coalesce(cds);
		// 		assert.equal(newSrc, false);
		// 	},


		// 	"should return limit source when coalescing a limit source": function limitSource() {
		// 		var sds = SortDocumentSource.createFromJson({a:1}),
		// 			lds = LimitDocumentSource.createFromJson(1);

		// 		// TODO: add missing test cases.
		// 		// array json getLimit
		// 		// getShardSource
		// 		// getMergeSource


		// 		var newSrc = sds.coalesce(LimitDocumentSource.createFromJson(10));
		// 		assert.ok(newSrc instanceof LimitDocumentSource);
		// 		assert.equal(sds.getLimit(), 10);
		// 		assert.equal(newSrc.limit, 10);

		// 		sds.coalesce(LimitDocumentSource.createFromJson(5));
		// 		assert.equal(sds.getLimit(), 5);

		// 		var arr = [];
		// 		sds.serializeToArray(arr);
		// 		assert.deepEqual(arr, [{$sort: {a:1}}, {$limit: 5}]);

		// 		// TODO: add missing test cases
		// 		// doc array get limit
		// 		// getShardSource
		// 		// get MergeSource

		// 	},
		// },

		// "#dependencies": {
		// 	/** Dependant field paths. */
		// 	"should have Dependant field paths": function dependencies() {
		// 		var sds = new SortDocumentSource();
		// 		sds.addKey("a", true);
		// 		sds.addKey("b.c", false);
		// 		var deps = {};
		// 		assert.equal("SEE_NEXT", sds.getDependencies(deps));
		// 		assert.equal(2, Object.keys(deps).length);
		// 		assert.ok(deps.a);
		// 		assert.ok(deps["b.c"]);
		// 		// TODO: Add needWholeDocument
		// 		// TODO: Add needTextScore
		// 	}
		// }

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).grep(process.env.MOCHA_GREP || '').run(process.exit);

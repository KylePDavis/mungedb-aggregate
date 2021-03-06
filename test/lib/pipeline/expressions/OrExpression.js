"use strict";
var assert = require("assert"),
	OrExpression = require("../../../../lib/pipeline/expressions/OrExpression"),
	Expression = require("../../../../lib/pipeline/expressions/Expression");


module.exports = {

	"OrExpression": {

		"constructor()": {

			"should not throw Error when constructing without args": function testConstructor(){
				assert.doesNotThrow(function(){
					new OrExpression();
				});
			}

		},

		"#getOpName()": {

			"should return the correct op name; $or": function testOpName(){
				assert.equal(new OrExpression().getOpName(), "$or");
			}

		},

		"#getFactory()": {

			"should return the constructor for this class": function factoryIsConstructor(){
				assert.equal(new OrExpression().getFactory(), OrExpression);
			}

		},

		"#evaluate()": {

			"should return false if no operors were given; {$or:[]}": function testEmpty(){
				assert.equal(Expression.parseOperand({$or:[]}).evaluate(), false);
			},

			"should return true if operors is one true; {$or:[true]}": function testTrue(){
				assert.equal(Expression.parseOperand({$or:[true]}).evaluate(), true);
			},

			"should return false if operors is one false; {$or:[false]}": function testFalse(){
				assert.equal(Expression.parseOperand({$or:[false]}).evaluate(), false);
			},

			"should return true if operors are true or true; {$or:[true,true]}": function testTrueTrue(){
				assert.equal(Expression.parseOperand({$or:[true,true]}).evaluate(), true);
			},

			"should return true if operors are true or false; {$or:[true,false]}": function testTrueFalse(){
				assert.equal(Expression.parseOperand({$or:[true,false]}).evaluate(), true);
			},

			"should return true if operors are false or true; {$or:[false,true]}": function testFalseTrue(){
				assert.equal(Expression.parseOperand({$or:[false,true]}).evaluate(), true);
			},

			"should return false if operors are false or false; {$or:[false,false]}": function testFalseFalse(){
				assert.equal(Expression.parseOperand({$or:[false,false]}).evaluate(), false);
			},

			"should return false if operors are false, false, or false; {$or:[false,false,false]}": function testFalseFalseFalse(){
				assert.equal(Expression.parseOperand({$or:[false,false,false]}).evaluate(), false);
			},

			"should return false if operors are false, false, or false; {$or:[false,false,true]}": function testFalseFalseTrue(){
				assert.equal(Expression.parseOperand({$or:[false,false,true]}).evaluate(), true);
			},

			"should return true if operors are 0 or 1; {$or:[0,1]}": function testZeroOne(){
				assert.equal(Expression.parseOperand({$or:[0,1]}).evaluate(), true);
			},

			"should return false if operors are 0 or false; {$or:[0,false]}": function testZeroFalse(){
				assert.equal(Expression.parseOperand({$or:[0,false]}).evaluate(), false);
			},

			"should return true if operor is a path String to a truthy value; {$or:['$a']}": function testFieldPath(){
				assert.equal(Expression.parseOperand({$or:['$a']}).evaluate({a:1}), true);
			}

		},

		"#optimize()": {

			"should optimize a constant expression to a constant; {$or:[1]} == true": function testOptimizeConstantExpression(){
				assert.deepEqual(Expression.parseOperand({$or:[1]}).optimize().toJSON(true), {$const:true});
			},

			"should not optimize a non-constant expression; {$or:['$a']}; SERVER-6192": function testNonConstant(){
				assert.deepEqual(Expression.parseOperand({$or:['$a']}).optimize().toJSON(), {$or:['$a']});
			},

			"should optimize an expression with a path or a '1' (is entirely constant); {$or:['$a',1]}": function testNonConstantOne(){
				assert.deepEqual(Expression.parseOperand({$or:['$a',1]}).optimize().toJSON(true), {$const:true});
			},

			"should optimize an expression with a field path or a '0'; {$or:['$a',0]}": function testNonConstantZero(){
				assert.deepEqual(Expression.parseOperand({$or:['$a',0]}).optimize().toJSON(), {$and:['$a']});
			},

			"should optimize an expression with two field paths or '1' (is entirely constant); {$or:['$a','$b',1]}": function testNonConstantNonConstantOne(){
				assert.deepEqual(Expression.parseOperand({$or:['$a','$b',1]}).optimize().toJSON(true), {$const:true});
			},

			"should optimize an expression with two field paths or '0'; {$or:['$a','$b',0]}": function testNonConstantNonConstantZero(){
				assert.deepEqual(Expression.parseOperand({$or:['$a','$b',0]}).optimize().toJSON(), {$or:['$a','$b']});
			},

			"should optimize an expression with '0', '1', or a field path; {$or:[0,1,'$a']}": function testZeroOneNonConstant(){
				assert.deepEqual(Expression.parseOperand({$or:[0,1,'$a']}).optimize().toJSON(true), {$const:true});
			},

			"should optimize an expression with '0', '0', or a field path; {$or:[0,0,'$a']}": function testZeroZeroNonConstant(){
				assert.deepEqual(Expression.parseOperand({$or:[0,0,'$a']}).optimize().toJSON(), {$and:['$a']});
			},

			"should optimize nested $or expressions properly or optimize out values evaluating to false; {$or:[0,{$or:[0]},'$a','$b']}": function testNested(){
				assert.deepEqual(Expression.parseOperand({$or:[0,{$or:[0]},'$a','$b']}).optimize().toJSON(), {$or:['$a','$b']});
			},

			"should optimize nested $or expressions containing a nested value evaluating to false; {$or:[0,{$or:[{$or:[1]}]},'$a','$b']}": function testNestedOne(){
				assert.deepEqual(Expression.parseOperand({$or:[0,{$or:[{$or:[1]}]},'$a','$b']}).optimize().toJSON(true), {$const:true});
			}

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);

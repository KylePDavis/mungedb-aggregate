"use strict";
var assert = require("assert"),
	VariablesIdGenerator = require("../../../../lib/pipeline/expressions/VariablesIdGenerator");


module.exports = {

	"VariablesIdGenerator": {

		"constructor": {

			"Should be able to construct": function canConstruct() {
				var variablesIdGenerator = new VariablesIdGenerator();
			}

		},

		"#generateId": {

			"ids start at 0": function idsStart() {
				var variablesIdGenerator = new VariablesIdGenerator(),
					id = variablesIdGenerator.generateId();
				assert.equal(id, 0);
			},

			"can generate 2 ids": function twoIds() {
				var variablesIdGenerator = new VariablesIdGenerator(),
					id = variablesIdGenerator.generateId();
				assert.equal(id, 0);
				id = variablesIdGenerator.generateId();
				assert.equal(id, 1);
			}

		},

		"#getIdCount": {

			"id count is correct": function idCountCorrect() {
				var variablesIdGenerator = new VariablesIdGenerator(),
					id = variablesIdGenerator.generateId(),
					numCalls = 1;
				id = variablesIdGenerator.generateId();
				numCalls++;
				id = variablesIdGenerator.generateId();
				numCalls++;
				id = variablesIdGenerator.generateId();
				numCalls++;
				assert.equal(variablesIdGenerator.getIdCount(), numCalls);
			}

		}

	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run(process.exit);

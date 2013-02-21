var assert = require("assert"),
	Pipeline = require("../../../lib/pipeline/Pipeline"),
	PipelineD = require("../../../lib/pipeline/PipelineD"),
	DocumentSource = require('../../../lib/pipeline/documentSources/DocumentSource'),
	CursorDocumentSource = require('../../../lib/pipeline/documentSources/CursorDocumentSource');



module.exports = {

	"Pipeline": {
		before: function(){
			Pipeline.StageDesc.$test = (function(){
			var klass = function TestDocumentSource(options){
				base.call(this);
				
				this.shouldCoalesce = options.coalesce;
				this.coalesceWasCalled = false;
				this.optimizeWasCalled = false;
				this.resetWasCalled = false;
				
				this.current = 5;
				
			}, base = DocumentSource, proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});
			
			
			proto.coalesce = function(){
				this.coalesceWasCalled = true;
				
				var c = this.shouldCoalesce;//only coalesce with the first thing we find
				this.shouldCoalesce = false;
				return c;
			};
			proto.optimize = function(){
				this.optimizeWasCalled = true;
			};
			proto.eof = function(){
				return this.current < 0;
			};
			proto.advance = function(){
				this.current = this.current - 1;
				return !this.eof();
			};
			proto.getCurrent = function(){
				return this.current;
			};
			
			proto.reset = function(){	
				this.resetWasCalled = true; 
			};
			proto.getDependencies = function(deps){
				if (!deps.testDep){
					deps.testDep = 1;
					return DocumentSource.GetDepsReturn.SEE_NEXT;
				}
				return DocumentSource.GetDepsReturn.EXHAUSTIVE;
			};
			
			return klass;
		})();
		
		//TODO:remove this once Match is implemented!!!
		Pipeline.MatchDocumentSource = (function(){
			var klass = function MatchDocumentSource(){
				
			}, base = require('../../../lib/pipeline/documentSources/DocumentSource'), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});
			klass.matchName = "$match";
			return klass;
		})();
		Pipeline.StageDesc.$match = Pipeline.MatchDocumentSource;
		
		//TODO:remove this once Sort is implemented!!!
		Pipeline.SortDocumentSource = (function(){
			var klass = function SortDocumentSource(){
				
			}, base = require('../../../lib/pipeline/documentSources/DocumentSource'), proto = klass.prototype = Object.create(base.prototype, {constructor:{value:klass}});
			klass.sortName = "$sort";
			return klass;
		})();
		Pipeline.StageDesc.$sort = Pipeline.SortDocumentSource;
			
		},
		"prepareCursorSource": {
			"should call reset on all sources":function(){
				var p = Pipeline.parseCommand([{$test:{coalesce:false}}, {$test:{coalesce:false}}]);
				
				PipelineD.prepareCursorSource(p, [1,2,3,4,5]);
				
				p.sourceVector.forEach(function(source){
					assert.equal(source.resetWasCalled, true);
				});
			},
			
			"should return a CursorDocumentSource":function(){
				var p = Pipeline.parseCommand([{$test:{coalesce:false}}, {$test:{coalesce:false}}]),
					cs = PipelineD.prepareCursorSource(p, [1,2,3,4,5]);
				
				assert.equal(cs.constructor, CursorDocumentSource);
			},
			
			"should get projection from all sources":function(){
				var p = Pipeline.parseCommand([{$test:{coalesce:false}}, {$test:{coalesce:false}}]),
					cs = PipelineD.prepareCursorSource(p, [1,2,3,4,5]);
				
				assert.deepEqual(cs._projection, {"_id":0,"testDep":1});
			}
		}
	}

};

if (!module.parent)(new(require("mocha"))()).ui("exports").reporter("spec").addFile(__filename).run();
var util = require('util')
  , assert = require('assert')
  , path = require('path')
  , Readable = require('stream').Readable
  , jsonLdContextInfer = require('..');

var fixture = [
  { a: '2013-01-01', b: '2013-12-27T20:58:23.768Z', c: 'papaya', d: 10, e: 0.1, f: true },
  { a: '2013-01-02', b: '2013-12-28T20:58:23.768Z', c: 'lemon',  d: 15, e: 0.2, f: false },
  { a: '2013-01-03', b: '2013-12-29T20:58:23.768Z', c: 'lemon',  d: '', e: 1e-3, f: true }
];

describe('jsonld-context-infer', function(){

  var s;

  beforeEach(function(){
    s = new Readable({objectMode:true});
    fixture.forEach(function(x){
      s.push(x);
    });
    s.push(null);
  });

  it('should infer @context', function(done){

    var expectedContext = {
      '@context': {
        xsd: "http://www.w3.org/2001/XMLSchema#",
        a: { "@id": "_:a", "@type": "xsd:date" },
        b: { "@id": "_:b", "@type": "xsd:dateTime" },
        c: { "@id": "_:c", "@type": "xsd:string" },
        d: { "@id": "_:d", "@type": "xsd:integer" },
        e: { "@id": "_:e", "@type": "xsd:double" },
        f: { "@id": "_:f", "@type": "xsd:boolean" }
      }
    };

    var expectedScores = {
      a: { "xsd:string": 0, "xsd:double": 0, "xsd:integer": 0, "xsd:date": 3, "xsd:dateTime": 0, "xsd:boolean": 0 },
      b: { "xsd:string": 0, "xsd:double": 0, "xsd:integer": 0, "xsd:date": 0, "xsd:dateTime": 3, "xsd:boolean": 0 },
      c: { "xsd:string": 3, "xsd:double": 0, "xsd:integer": 0, "xsd:date": 0, "xsd:dateTime": 0, "xsd:boolean": 0 },
      d: { "xsd:string": 0, "xsd:double": 0, "xsd:integer": 2, "xsd:date": 0, "xsd:dateTime": 0, "xsd:boolean": 0 },
      e: { "xsd:string": 0, "xsd:double": 3, "xsd:integer": 0, "xsd:date": 0, "xsd:dateTime": 0, "xsd:boolean": 0 },
      f: { "xsd:string": 3, "xsd:double": 0, "xsd:integer": 0, "xsd:date": 0, "xsd:dateTime": 0, "xsd:boolean": 3 }
    };

    jsonLdContextInfer(s, function(err, context, scores){
      if(err) throw err;
      assert.deepEqual(context, expectedContext);
      assert.deepEqual(scores, expectedScores);
      done();
    });

  });

  it('should convert infered @context in columns when no order is specified', function(done){
    jsonLdContextInfer(s, function(err, context, scores){
      if(err) throw err;
      var columns = jsonLdContextInfer.columns(context);

      var expected = [
        { "name": "a", "datatype": "date" },
        { "name": "b", "datatype": "dateTime" },
        { "name": "c", "datatype": "string" },
        { "name": "d", "datatype": "integer" },
        { "name": "e", "datatype": "double" },
        { "name": "f", "datatype": "boolean" }
      ];

      assert.deepEqual(columns.sort(function (a, b) {
        if (a.name > b.name) return 1;
        if (a.name < b.name) return -1;
        return 0;
      }), expected);

      done();
    });
  });

  it('should convert infered @context in columns when order is specified', function(done){
    jsonLdContextInfer(s, function(err, context, scores){
      if(err) throw err;
      var columns = jsonLdContextInfer.columns(context, ['f', 'a', 'b', 'c', 'd', 'e']);

      var expected = [
        { "name": "f", "datatype": "boolean" },
        { "name": "a", "datatype": "date" },
        { "name": "b", "datatype": "dateTime" },
        { "name": "c", "datatype": "string" },
        { "name": "d", "datatype": "integer" },
        { "name": "e", "datatype": "double" }
      ];

      assert.deepEqual(columns, expected);

      done();
    });
  });

  it('should infer @context using only nSample samples', function(done){
    jsonLdContextInfer(s, {nSample: 2}, function(err, context, scores){
      if(err) throw err;

      var expectedScores = {
        a: { "xsd:string": 0, "xsd:double": 0, "xsd:integer": 0, "xsd:date": 2, "xsd:dateTime": 0, "xsd:boolean": 0 },
        b: { "xsd:string": 0, "xsd:double": 0, "xsd:integer": 0, "xsd:date": 0, "xsd:dateTime": 2, "xsd:boolean": 0 },
        c: { "xsd:string": 2, "xsd:double": 0, "xsd:integer": 0, "xsd:date": 0, "xsd:dateTime": 0, "xsd:boolean": 0 },
        d: { "xsd:string": 0, "xsd:double": 0, "xsd:integer": 2, "xsd:date": 0, "xsd:dateTime": 0, "xsd:boolean": 0 },
        e: { "xsd:string": 0, "xsd:double": 2, "xsd:integer": 0, "xsd:date": 0, "xsd:dateTime": 0, "xsd:boolean": 0 },
        f: { "xsd:string": 2, "xsd:double": 0, "xsd:integer": 0, "xsd:date": 0, "xsd:dateTime": 0, "xsd:boolean": 2 }
      };

      assert.deepEqual(scores, expectedScores);
      done();
    });
  });

  it('should infer @context when nSample is set to Infinity', function(done){
    jsonLdContextInfer(s, {nSample: Infinity}, function(err, context, scores){
      if(err) throw err;
      assert.equal(scores.a['xsd:date'], 3);
      done();
    });
  });

});

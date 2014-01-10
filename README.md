jsonld-context-infer
====================

Infer a [JSON-LD](http://json-ld.org/)
[@context](http://json-ld.org/spec/latest/json-ld/#the-context) from a
readable stream operating in object mode.

[![NPM](https://nodei.co/npm/jsonld-context-infer.png)](https://nodei.co/npm/jsonld-context-infer/)

#Type infered

- String -> [xsd:string](http://www.w3.org/TR/xmlschema-2/#string)
- Number: a number including floating point numbers -> [xsd:double](http://www.w3.org/TR/xmlschema-2/#double)
- integer -> [xsd:integer](http://www.w3.org/TR/xmlschema-2/#integer)
- date (in ISO6801 format YYYY-MM-DD) -> [xsd:date](http://www.w3.org/TR/xmlschema-2/#date)
- dateTime (in ISO8601 format of YYYY-MM-DDThh:mm:ssZ) -> [xsd:dateTime](http://www.w3.org/TR/xmlschema-2/#dateTime)
- Boolean: -> [xsd:boolean](http://www.w3.org/TR/xmlschema-2/#boolean)

#Usage

From a readable stream in object mode emitting for instance:

    { a: 1, b: 2.3 }
    { a: 2, b: 3.6 }

The script

    var jsonLdContextInfer = require('jsonldContextInfer);
    
    jsonLdContextInfer(s, function(err, schema, scores){
       console.log(schema, scores);
    });

will outputs:

schema:

    {
      "@context": {
        xsd: "http://www.w3.org/2001/XMLSchema#",
        a: { "@id": "_:a", "@type": "xsd:integer" },
        b: { "@id": "_:b", "@type": "xsd:double" }
      }
    }

scores:

    {
      a: { "xsd:string": 0, "xsd:double": 2, "xsd:integer": 2, "xsd:date": 0, "xsd:dateTime": 0, "xsd:boolean": 1 },
      b: { "xsd:string": 0, "xsd:double": 2, "xsd:integer": 0, "xsd:date": 0, "xsd:dateTime": 0, "xsd:boolean": 0 }
    }


#API

##jsonLdContextInfer(readableStream, [options], callback)

options :
- ```nSample```: if specified only the ```nSample``` first rows of the source will be used to infer the types otherwise all the rows will be used

#Tests

    npm test

#License

MIT

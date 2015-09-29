var once = require('once');

var re = {
  number: /^(?:-?(?:[0-9]+))?(?:\.[0-9]*)?(?:[eE][\+\-]?(?:[0-9]+))?$/,
  date: /^\d{4}-[01]\d-[0-3]\d$/,
  dateTime: /^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/, //from http://www.pelagodesign.com/blog/2009/05/20/iso-8601-date-validation-that-doesnt-suck/
  boolean: /^true$|^false$|^1$|^0$/
};

function infer(s, opts, callback){

  if(arguments.length === 2){
    callback = opts;
    opts = {};
  }

  var nSample = opts.nSample || Infinity;
  nSample = (nSample > 0) ? nSample: 1;

  callback = once(callback);

  var cnt = 0
    , scores = {};

  s.on('data', function(obj){

    if(cnt === 0){
      for(var key in obj){
        scores[key] = {
          "xsd:string": 0,
          "xsd:double": 0,
          "xsd:integer": 0,
          "xsd:date": 0,
          "xsd:dateTime": 0,
          "xsd:boolean": 0
        };
      }
    }

    if (nSample === Infinity || (cnt < nSample)) {

      for(var key in obj){
        var x = obj[key];

        if( re.boolean.test(x) ) {
          scores[key]['xsd:boolean']++;
        }

        if (re.number.test(x)){
          x = parseFloat(x, 10);
          if (x % 1 === 0) {
            scores[key]['xsd:integer']++;
          } else {
            scores[key]['xsd:double']++;
          }
        } else if (re.date.test(x)){
          scores[key]['xsd:date']++;
        } else if (re.dateTime.test(x)){
          scores[key]['xsd:dateTime']++;
        } else{
          scores[key]['xsd:string']++;
        }
      }
    }

    if (cnt === nSample) {
      try{
        s.end();
        s.destroy();
      } catch(e){
        //console.error(e);
      };
    }

    cnt++;

  })
    .on('error', callback)
    .on('end', function(){

      var ctx = { xsd: "http://www.w3.org/2001/XMLSchema#" };

      for(var key in scores){
        var score = scores[key];

        var mainType = 'xsd:string';

        Object.keys(score).forEach(function(t){
          if(score[t] > score[mainType]){
            mainType = t;
          }
        });

        if(mainType === 'xsd:integer' && score['xsd:double']){
          mainType = 'xsd:double';
        } else if( (mainType === 'xsd:string') && (score['xsd:string'] === score['xsd:boolean']) ){
          mainType = 'xsd:boolean';
        } else if( (mainType === 'xsd:integer') && (score['xsd:integer'] === score['xsd:boolean']) ){
          mainType = 'xsd:boolean';
        }

        ctx[key] = { '@id': '_:'+ key, '@type': mainType };
      }

      callback(null, { '@context': ctx }, scores);
    });

};

infer.columns = function(ctx, order){

  ctx = ctx['@context'] || ctx;
  order = order || Object.keys(ctx);

  var columns = [];
  for(var i=0; i< order.length; i++){
    var key = order[i];
    if (key !== 'xsd'){
      columns.push({name: ctx[key]['@id'].split(':')[1], datatype: ctx[key]['@type'].replace('xsd:', '')});
    }
  }

  return columns;
};


module.exports = infer;

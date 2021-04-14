//Run all unit tests from ./tests
//expected format:
//  code file       : ./tests/<test name>/code.json
//  In/expected out : ./tests/<test name>/IO.json

'use strict';

const fs = require('fs');
const testing = require("./testing");

console.log("Starting unit tests!");


var _P=testing.perfStruct();

fs.readdir(`${__dirname}/tests`,(err, testNames)=>{
    if(err) throw err;
    console.log(`Loading ${testNames.length} tests:`);
    var tests = [];
    testNames.forEach(t=>{
        if(t.startsWith("skip=")){
            console.log(`Skipped ${t.replace("skip=","")}`);
            return;
        }
        /*PERF*/ _P.setLoad.start.push(Date.now());
        var code = fs.readFileSync(`${__dirname}/tests/${t}/code.yolol`).toString().split("\r\n");
        var IO = require(`${__dirname}/tests/${t}/IO.json`)
        /*PERF*/ _P.setLoad.stop.push(Date.now());
        console.log(`\t Loaded ${t} with ${code.length} lines & ${IO.out.length} test cases, running...`);

        testing.run(_P, code, IO);

    });
    testing.calcPerf(_P);

});



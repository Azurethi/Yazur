const yNetMgr = require("./modules/interface/YololNetworkManager");
const yChip = require("./modules/interface/YololChip");

module.exports = {
    perfStruct:()=>({   //performance
        setLoad: {start:[], stop:[]},
        netSetup: {start:[], stop:[]},
        chipSetup: {start:[], stop:[]},
        fieldSetup: {start:[], stop:[]},
        netSubscribe: {start:[], stop:[]},
        testFieldSetup: {start:[], stop:[]},
        testExec: {start:[], stop:[]},
        testYololTick:{start:[], stop:[]},
        testValid: {start:[], stop:[]}
    }),
    calcPerf:(_P)=>{
        console.log("");
        console.log("Calculating performance averages...");

        Object.keys(_P).forEach(metric=>{
            var mData = _P[metric];
            var avgTime = 0;
            for(var j=0; j<mData.start.length; j++){
                avgTime+= mData.stop[j] - mData.start[j];
            }
            avgTime/=mData.start.length;
            console.log(`\t${metric}: ${avgTime}ms (average over ${mData.start.length} runs)`);
        });
    },
    run:(_P, code, IO)=>{
        var test = {
            code,
            IO
        };
        var testStart=Date.now();
        var yololTicks=0;

        //Create network
        /*PERF*/ _P.netSetup.start.push(Date.now());
        var testNet = new yNetMgr();
        /*PERF*/ _P.netSetup.stop.push(Date.now());

        //chip setup
        /*PERF*/ _P.chipSetup.start.push(Date.now());
        var chip = new yChip(test.code,"root");
        /*PERF*/ _P.chipSetup.stop.push(Date.now());


        //Get & add testing globals
        /*PERF*/ _P.fieldSetup.start.push(Date.now());
        var iFields = Object.keys(test.IO.in[0]);
        var oFields = Object.keys(test.IO.out[0]);

        oFields.forEach(field=>{
            chip.localEnv.fields[":"+field]={type:3, subtype:(typeof test.IO.out[0][field])=="string"?0:1, value:0};
        })

        //add done field
        chip.localEnv.fields[":done"]={type:3, subtype:1, value:0};
        /*PERF*/ _P.fieldSetup.stop.push(Date.now());

        //add chip to network
        /*PERF*/ _P.netSubscribe.start.push(Date.now());
        chip.subscribe(testNet);
        /*PERF*/ _P.netSubscribe.stop.push(Date.now());

        var TickLimit=2000;
        for(var testCase=0; testCase<test.IO.in.length; testCase++){
            
            /*PERF*/ _P.testFieldSetup.start.push(Date.now());
            iFields.forEach(field=>{
                chip.localEnv.global[":"+field]={
                    type:3, 
                    subtype:(typeof test.IO.in[testCase][field])=="string"?0:1, 
                    value:test.IO.in[testCase][field]
                }
            });
            /*PERF*/ _P.testFieldSetup.stop.push(Date.now());
            
            var i=0;
            /*PERF*/ _P.testExec.start.push(Date.now());
            while(i++<TickLimit && chip.localEnv.global[':done'].value==0){
                /*PERF*/ _P.testYololTick.start.push(Date.now());
                testNet.queueTick();
                testNet.doTick();
                /*PERF*/ _P.testYololTick.stop.push(Date.now());
            }
            yololTicks+=i;
            /*PERF*/ _P.testExec.stop.push(Date.now());

            /*PERF*/ _P.testValid.start.push(Date.now());
            if(chip.localEnv.global[':done'].value!=0){ //Chip finished this test case
                chip.localEnv.global[':done']={type:3, subtype:1, value:0};
                var passed=true;
                oFields.forEach(field=>{
                    if(chip.localEnv.global[':'+field].value!==test.IO.out[testCase][field]){
                        console.log(`\t\t\t Testcase ${testCase}, expected :${field}=${test.IO.out[testCase][field]}, but got =${chip.localEnv.global[':'+field].value}`);
                        passed = false;
                    }
                });
                if(!passed){
                    //console.log(`\t\tFailed test case ${testCase}`);
                    throw "Failed test case";
                }else{
                    //console.log(`\t\tCompleted case ${testCase} in ${i} ticks`)
                }
            }else if(i>=TickLimit){
                throw `Reached Tick limit on case ${testCase}`;
            }
            /*PERF*/ _P.testValid.stop.push(Date.now());
        }
        console.log(`\t\tPASSED SET, took ${yololTicks} ticks over ${Date.now()-testStart}ms`);
    }
}
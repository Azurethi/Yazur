import interpret from './interpret'
const testSuite = require('testing/suite');

const TICK_LIMIT = 2000;

testSuite.forEachBasicTest((testData)=>{

    test(`Interpreting: basic_test: ${testData.name}`,()=>{
        testData.IO.in.forEach((input,testCase)=>{
            var chip = {
                localEnv:{
                    vars:{},
                    global:{
                        ":done":{type:3, subtype:1, value:0}
                    },
                    nextBroadcast:{},
                    nextLine:1
                },
                parsed: testData.expect.parse,
                yololBuffered:true
            }
        
            testSuite.addFields(chip.localEnv.global,testData.IO);
            Object.keys(testData.IO.in[0]).forEach(field=>{
                chip.localEnv.global[":"+field]={
                    type:3, 
                    subtype:(typeof testData.IO.in[testCase][field])=="string"?0:1, 
                    value:testData.IO.in[testCase][field]
                }
            });

            var i=0;
            while(i++<TICK_LIMIT && chip.localEnv.global[':done'].value==0){
                interpret(chip);
            }

            if(chip.localEnv.global[':done'].value!=0){ //Chip finished this test case
                Object.keys(testData.IO.out[0]).forEach(field=>{
                    expect(chip.localEnv.global[':'+field].value).toBe(testData.IO.out[testCase][field])
                });
            } else {
                fail(":done was not set. (tick limit reached)");
            }

            
        });
    });

});
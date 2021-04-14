const Y = require('./yazur');
const fs = require('fs');
const { TestScheduler } = require('@jest/core');
const { fail } = require('assert');
const { PassThrough } = require('stream');

const NUM_TEST_POINTS_PER_SET = 100;
const NUM_TEST_SETS = 20;
const TEST_POINT_BOUND=100000;
const REFS_POINT_BOUND=1000000;
const INVENG_TICK_LIMIT=100;
const AXPROC_TICK_LIMIT=10;

const TEST_PASS_ACCURACY=10;

const AX = ["x","y","z"];
//----------------------{ Full multichip system test (based on ISANv2_dev release) }----------------------\\
var chipFiles = fs.readdirSync(`${__dirname}\\testing\\ISAN multichip\\chips`);

var yChips = [];
chipFiles.forEach(chipFile=>{
    var code = fs.readFileSync(`${__dirname}\\testing\\ISAN multichip\\chips\\${chipFile}`).toString().replace(/\r\n/g,"\n").split("\n");
    var cleaned=[];
    code.forEach(line=>{
        cleaned.push(line.trim())
    });
    yChips.push(new Y.yChip(cleaned));
});

//Globals:      (FROM YOREL)
//  :setup          - Setup script halt ctrl (Set==1 to start system)
//  :M[1-4]         - Message filter for transmitter [1-4]
//  :R[1-4]         - Signal Strength of transmitter [1-4]
//  :[X|Y|Z][1-4]   - Position of transmitter [1-4]
//
//  :rst=1          - Inversion engine halt ctrl (handled by setup)
//  :[X|Y|Z][A-D]   - Axis scale constants
//  :[X|Y|Z]E       - Axis offset constants
//
//  :[X|Y|Z]        - The position of the core
//
//  :PosV2          - Text display output field
var mChips = [];
var globalVars = [  //This creates more memory chips than nessesary, but should still be fine
    ["PosV2", "X", "Y", "Z"],   //Main ISAN output vars
    ["XA","XB","XC","XD","XE"], //X axis consts
    ["YA","YB","YC","YD","YE"], //Y axis consts
    ["ZA","ZB","ZC","ZD","ZE"], //Z axis consts
    ["rst"],                    //InvEng halt       (setup var ommited as setup script functionality replaced within this test)
    ["X1","Y1","Z1"],           //Transmitter 1 position
    ["X2","Y2","Z2"],           //Transmitter 2 position
    ["X3","Y3","Z3"],           //Transmitter 3 position
    ["X4","Y4","Z4"],           //Transmitter 4 position
    ["R1","R2","R3","R4"],      //Transmitter received value standins
];
globalVars.forEach(varset=>mChips.push(new Y.mChip(varset)))

//Create network
var network = new Y.netmgr();
yChips.forEach(chip=>chip.subscribe(network));
mChips.forEach(chip=>chip.subscribe(network));

for(var set_i=0; set_i<NUM_TEST_SETS; set_i++){
    test(`ISAN multichip system test ${set_i}/${NUM_TEST_SETS}, checking ${NUM_TEST_POINTS_PER_SET} points`, ()=>{
        var refs=[];
        for(var i=0; i<4; i++){
            var newRef=[
                (Math.random()-0.5)*REFS_POINT_BOUND,
                (Math.random()-0.5)*REFS_POINT_BOUND,
                (Math.random()-0.5)*REFS_POINT_BOUND
            ];
            AX.forEach((ax,axi)=>{
                network.broadcast("root",`:${ax}${i+1}`,{type:3, subtype:1, value:newRef[axi]});
            });
            refs.push(newRef);
        }

        //run inveng till it flags done
        var ticks=0;
        //mChips[4].localEnv.fields[":rst"].value=1
        network.broadcast("root",":rst",{type:3, subtype:1, value:1});

        while(ticks++<INVENG_TICK_LIMIT && mChips[4].localEnv.global[":rst"].value==1){
            network.queueTick_random();
            network.doTick();
        }
        if(ticks==INVENG_TICK_LIMIT+1) fail("Inversion engine hit tick limit.");

        for(var pos_i=0; pos_i<NUM_TEST_POINTS_PER_SET; pos_i++){
            //get random point
            var pos=[
                (Math.random()-0.5)*TEST_POINT_BOUND,
                (Math.random()-0.5)*TEST_POINT_BOUND,
                (Math.random()-0.5)*TEST_POINT_BOUND
            ];
            
            //generate expected PosV2 output
            //var expectedOut = `\nX: ${Math.floor(pos[0])}\nY: ${Math.floor(pos[1])}\nZ: ${Math.floor(pos[2])}`;
            //update R[1-4]
            for(var i=0; i<4; i++){
                var acc=0;
                for(var j=0; j<3; j++){
                    acc+=Math.pow(refs[i][j]-pos[j],2)
                }
                network.broadcast("root",`:r${i+1}`,{type:3, subtype:1,
                    value:999999-Math.sqrt(acc)
                });
            }
            //run some ticks to stabilise
            var off;
            for(var i=0; i<AXPROC_TICK_LIMIT; i++) {
                network.queueTick_random();
                network.doTick();
                off = Math.sqrt(
                    Math.pow(mChips[0].localEnv.global[":x"].value-pos[0],2)+
                    Math.pow(mChips[0].localEnv.global[":y"].value-pos[1],2)+
                    Math.pow(mChips[0].localEnv.global[":z"].value-pos[2],2)
                );
                if(off<TEST_PASS_ACCURACY) break;
            }
            //console.log(mChips[0].localEnv.global[":posv2"].value);
            
            //console.log(`Off: ${off}`);
            
            if(off>TEST_PASS_ACCURACY){
                fail(`ISAN positional Error was >${TEST_PASS_ACCURACY} (${off}), potentially a fluke (coplanarity) if most other test passed`);
            }

        }
    });
}




debugger;
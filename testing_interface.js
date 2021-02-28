'use strict';

const yNetMgr = require("./modules/interface/YololNetworkManager");
const yChip = require("./modules/interface/YololChip");

const code = require("./yolol/universalParser.json");
console.log("Loaded code:")
code.forEach((line,i)=>{
    console.log(`\tLine ${i+1}: ${line}`)
});
console.log("\n")

var myYololNetwork = new yNetMgr();

var myYololChip = new yChip(
    code,
    "root",
    myYololNetwork
)

console.log("start");

var limit=100;
var i=0;
while(i++<limit && myYololChip.localEnv.nextLine<4){
    myYololNetwork.queueTick();
    myYololNetwork.doTick();
}
console.log(`DONE, executed ${i} lines`);


console.log(JSON.stringify(myYololChip.localEnv.vars,null,2));

console.log("hello world");

//Testing idea to replace strcmps with int id's
var ops=require("./modules/yolol/lang/operatorPrecedence.json");
console.log(ops);
var opids=[];
ops.forEach(op=>{
    var n=0;
    for(var i=0; i<op.length; i++) n+=op.charCodeAt(i);
    opids.push(n);
});

setTimeout(()=>{
    opids.sort((a,b)=>a-b);
    console.log(opids);
},1000);
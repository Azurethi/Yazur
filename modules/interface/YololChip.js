'use strict';
const interpret = require('../yolol/interpret');
const parse = require('../yolol/parse');
const lex = require('../yolol/lex');

class YololChip{
    constructor(code,subnetId="root", networkManager=null, buffer=true){
        this.code = code;
        this.subnetId=subnetId
        this.networkManager = networkManager;

        this.localEnv = {
            vars:{},    //local vars
            fields:{    //This devices fields & defaults
                ":chipwait":{type:3, subtype:1, value:0}
            },
            global:{    //discovered globals
                ":chipwait":{type:3, subtype:1, value:0}
            },   
            nextBroadcast:{},   //Globals changed by this chip
            chipwaitField:":chipwait", //Name of the chipwait field for this chip
            nextLine:1
        };

        if(buffer){
            this.lexed = [];
            this.parsed = [];
            this.code.forEach((line,i)=>{
                this.lexed[i] = lex(line,i);
                this.parsed[i] = parse(this.lexed[i]);
            });
        }
        
        //TODO make this an array to allow buffering of individual lines
        this.yololBuffered=buffer;   //REM: set this false when code edited

        if(networkManager!=null) networkManager.register(this);
    }

    subscribe(networkManager){
        this.networkManager = networkManager;
        networkManager.register(this);
    }

    broadcast(){
        Object.keys(this.localEnv.nextBroadcast).forEach(globalField=>{
            this.networkManager.broadcast(
                this.subnetId,
                globalField,
                this.localEnv.nextBroadcast[globalField]
            )
        });
        this.localEnv.nextBroadcast=[];
    }

    setup(){
        Object.keys(this.localEnv.fields).forEach(myFieldName=>{
            this.localEnv.nextBroadcast[myFieldName]=this.localEnv.fields[myFieldName];
        });
        this.broadcast();
    }

    update(subnet, globalField, globalValue){
        if(this.subnetId.startsWith(subnet)){
            this.localEnv.global[globalField]={
                type: globalValue.type,
                subtype: globalValue.subtype,
                value: globalValue.value
            };
        }
    }

    doTick(){
        var chipwait=this.localEnv.global[this.localEnv.chipwaitField].value;
        if(chipwait>=0 && chipwait<1){
            interpret(this);
        } else {
            this.localEnv.nextBroadcast[this.localEnv.chipwaitField]=--this.localEnv.global[this.localEnv.chipwaitField];
        }
    }

}
module.exports=YololChip;
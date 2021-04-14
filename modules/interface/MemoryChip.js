'use strict';

class MemoryChip{
    constructor(fields,subnetId="root", networkManager=null){
        this.subnetId=subnetId
        this.networkManager=networkManager;

        this.localEnv = {
            vars:{},    //local vars
            fields:{},
            global:{},   
            nextBroadcast:{},   //Globals changed by this chip
        };

        //default specified fields to 0
        fields.forEach(field=>{
            this.localEnv.fields[`:${field.toLowerCase()}`]={type:3, subtype:1, value:0};
        });

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
        if(this.subnetId.startsWith(subnet))  this.localEnv.global[globalField]=globalValue;
    }

    doTick(){
        return;
    }

}
module.exports=MemoryChip;
'use strict';

class Reciever{
    //Fields: Field names for targetMessageField, signalStrengthField, messageField, targetMessageInit
    constructor(fields,transmitters,subnetId="root", networkManager=null){
        this.subnetId=subnetId
        this.networkManager=networkManager;

        this.localEnv = {
            vars:{},    //local vars
            fields:{},
            global:{},   
            nextBroadcast:{},   //Globals changed by this chip
            targetMessageField: `:${fields[0]}` || ":targetMessage",
            signalStrengthField: `:${fields[1]}` || ":signalStrength",
            messageField: `:${fields[2]}` || ":message",
            position:[0,0,0],
            transmitters
        };

        this.localEnv.fields[this.localEnv.targetMessageField] = {type:3, subtype:0, value:fields[3] || 0};
        this.localEnv.fields[this.localEnv.signalStrengthField] = {type:3, subtype:1, value:0};
        this.localEnv.fields[this.localEnv.messageField] = {type:3, subtype:0, value: ""};

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
        var target = this.localEnv.global[this.localEnv.targetMessageField].value;
        if(this.localEnv.transmitters[target]){   //Should also get closest, if target not set
            this.setVals(target, 999999-Math.sqrt(
                Math.pow(this.localEnv.position[0]-this.localEnv.transmitters[target].x,2)+
                Math.pow(this.localEnv.position[1]-this.localEnv.transmitters[target].y,2)+
                Math.pow(this.localEnv.position[2]-this.localEnv.transmitters[target].z,2)
            ));
        } else {
            //console.log("no target");
            this.setVals();
        }
    }

    setVals(message="", signal=0){
        this.localEnv.nextBroadcast[this.localEnv.signalStrengthField]={type:3, subtype:1, value: signal};
        this.localEnv.global[this.localEnv.signalStrengthField]={type:3, subtype:1, value: signal};

        this.localEnv.nextBroadcast[this.localEnv.messageField]={type:3, subtype:0, value: message};
        this.localEnv.global[this.localEnv.messageField]={type:3, subtype:0, value: message};
    }

    setPosition(x,y,z){
        this.localEnv.position = [x,y,z];
    }

}
module.exports=Reciever;
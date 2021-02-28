"use strict";
module.exports=class NetworkManager{
    constructor(){
        this.subnets={};
        this.subnetKeys=[];
    }

    addSubscription(chip, subnet){
        if(!this.subnetKeys.includes(subnet)){
            this.subnetKeys.push(subnet);
            this.subnets[subnet] = [];
        }
        this.subnets[subnet].push(chip);
    }

    broadcastUpdate(subnet, variable, value){
        this.subnetKeys.forEach(subnetkey=>{
            if(subnetkey===subnet || subnetkey.startsWith(`${subnet}.`)){
                this.subnets[subnet].forEach(chip=>{
                    try{
                        chip.updateGlobal(variable,value);
                    }catch(e){
                        //ignore
                    }
                })
            }
        })
    }
}
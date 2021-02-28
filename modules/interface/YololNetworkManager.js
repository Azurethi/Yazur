'use strict';

class YololNetworkManager{
    constructor(){
        this.devices=[];
        this.tickQueue=[];
    }

    register(device){
        this.devices.push(device);
        device.setup();
    }

    broadcast(subnet,field,value){
        this.devices.forEach(device=>{
            device.update(subnet,field,value);
        })
    }

    queueTick(){
        this.devices.forEach((dev,i)=>{
            this.tickQueue.push(i);
        })
    }

    queueTick_random(){
        function shuffle(array) {
            var currentIndex = array.length, temporaryValue, randomIndex;
          
            // While there remain elements to shuffle...
            while (0 !== currentIndex) {
          
              // Pick a remaining element...
              randomIndex = Math.floor(Math.random() * currentIndex);
              currentIndex -= 1;
          
              // And swap it with the current element.
              temporaryValue = array[currentIndex];
              array[currentIndex] = array[randomIndex];
              array[randomIndex] = temporaryValue;
            }
          
            return array;
        }
        this.queueTick();
        this.tickQueue = shuffle(this.tickQueue);
    }


    
    doTick(){
        this.tickQueue.forEach(devId=>{
            this.devices[devId].doTick();
        });
        this.tickQueue.forEach(devId=>{
            this.devices[devId].broadcast();
        });
        this.tickQueue=[];    
    }
}
module.exports=YololNetworkManager;
"use strict";
const l = console.log;

class Memspace {
    constructor(){
        this.mem={};
    }

    getVar(name){
        var jc = false;
        if(!this.mem[name]){
            this.mem[name]=0;   //TODO add types & default empty string??
            jc = true;
        }
        l(`memspace.get(${name}) [JC?${jc}] ==${this.mem[name]}`)
        return this.mem[name];
    }

    setVar(name,value){
        l(`memspace.set(${name}) ==${value}`)
        this.mem[name]=value;
    }
}

module.exports = Memspace;
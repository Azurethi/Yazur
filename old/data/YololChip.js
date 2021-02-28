"use strict";
var lexer = require('../../modules/yolol/lex');      //TODO combine files for web
var parser = require('../parse');   //TODO combine files for web

module.exports = class YololChip{

    constructor(lines){
        this.yololLines=lines
        this.localMem={};
        this.localGlobalCopy={
            ":chipwait":0
        };
        this.chipwaitField=":chipwait";
    }


    lex(){
        this.lexed=[];
        this.yololLines.forEach((line,i)=>{
            this.lexed.push(lexer(line,i));
        });
    }

    parse(){
        if(!this.lexed){
            throw "Must lex before parse";
        }
        this.parsed=[];
        this.lexed.forEach((line,i)=>{
            this.parsed.push(parser(line,i));
        });
    }


    subscribe(manager, subnet=""){
        this.subnet = subnet;
        this.netmgr = manager;
        manager.addSubscription(this, subnet)
    }

    updateGlobal(name, value){
        this.localGlobalCopy[name] = value;
    }

    getVar(name){
        if(name.startsWith(":")){   //is a global
            if(!this.localGlobalCopy[name]){
                throw `No known global varialbe by ${name}`
            }
            return this.localGlobalCopy[name];
        } else {
            if(!this.localMem[name]){
                this.localMem[name]=0;
                //jc = true;
            }
            //l(`memspace.get(${name}) [JC?${jc}] ==${this.mem[name]}`)
            return this.localMem[name];
        }
    }

    setVar(name, value){
        if(name.startsWith(":")){   //is a global
            if(!this.localGlobalCopy[name]){
                throw `No known global varialbe by ${name}`
            }
            this.netmgr.broadcast(this.subnet, name, value);
        } else {
           this.localMem[name] = value;
        }
    }
}
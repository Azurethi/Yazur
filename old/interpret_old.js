"use strict";
const Memspace = require('./memspace');

const l = console.log;

function interpret(block, memspace){
    var blocktype=block.block;
    var left=block["left"];
    var right=block["right"];
    switch(blocktype){
        case "value":
            switch(block.subtype){
                case "num":
                    return parseFloat(block.value); //TODO rounding
                case "str":
                    return block.value;
                case "sym":
                    return memspace.getVar(block.value);
                default: throw `Unknow value subtype`;
            }
        case "assignment":  l('entered assignment');
            if(left.type!=='val') throw `Tried to assign to a ${left.type} (not a val)`
            if(left.subtype!=='sym') throw `Tried to assign to a ${left.subtype} (not a sym)`
            memspace.setVar(left.value, interpret(right, memspace));
            break;
        case "operation":   l('entered operation');
            switch(block.type){
                case "+":
                    return interpret(left, memspace) + interpret(right, memspace);  //TODO rounding
                case "-":
                    return interpret(left, memspace) - interpret(right, memspace);  //TODO rounding
                case "*":
                    return interpret(left, memspace) * interpret(right, memspace);
                case "^":
                    return Math.pow(interpret(left, memspace), interpret(right, memspace));
                default:
                    throw `Unimplemented operator ${block.type}` //TODO better throw & imp more
            }
        default:
            throw `unknown block ${JSON.stringify(block)}`
    }
}

module.exports=(parsed, memspace = new Memspace())=>{
    parsed.forEach(block=>{
        interpret(block,memspace);
    })
}
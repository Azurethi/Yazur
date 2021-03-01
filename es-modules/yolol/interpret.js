export function interpret(chip) {
    if(!chip.yololBuffered) throw "Cannot interpret unbuffered line";
    try{
        var pline = chip.parsed[chip.localEnv.nextLine++ - 1];
        if(pline) pline.forEach(block=>{
            interpretBlock(block,chip);
        })
    }catch(e){
        if(!(typeof e=='string' && e.startsWith("#HALT INTERP:"))){
            console.log(e);
            throw e
        }
    }
    if(chip.localEnv.nextLine>20 || chip.localEnv.nextLine<1) chip.localEnv.nextLine=1;
}

export function interpretBlock(block, chip){
    switch(block.type){
        case -1: return;    //Space
        case 0: //Operator
            var left = block.left?interpret(block.left,chip):false;
            var right=interpret(block.right,chip);
            switch(block.subtype){
                case 0: //aritmetic
                    if(left.type!=3 && !block.negate) throw "Attempted arithmetic with non-value left"
                    if(right.type!=3) throw "Attempted arithmetic with non-value right"
                    return arith(block.value,left,right);
                case 1: //assignment
                    var target = block.left;
                    if(target.type!=3 || target.subtype!=2) throw "Tried to assign non-variable"
                    value=right;
                    switch(block.value){
                        case '+=': value = arith('+',left,right); break;
                        case '-=': value = arith('-',left,right); break;
                        case '*=': value = arith('*',left,right); break;
                        case '/=': value = arith('/',left,right); break;
                        case '%=': value = arith('%',left,right); break;
                    }
                    if(target.value.startsWith(":")){
                        chip.localEnv.global[target.value] = {type:value.type, subtype:value.subtype, value:value.value};
                        chip.localEnv.nextBroadcast[target.value] = {type:value.type, subtype:value.subtype, value:value.value};
                    } else {
                        chip.localEnv.vars[target.value] = {type:value.type, subtype:value.subtype, value:value.value};
                    }
                    //TODO logging
                    return;
                case 2: //compare
                    var leftVal = left.value;
                    var rightVal = right.value;
                    if(left.subtype==1) leftVal=truncate(parseFloat(leftVal));
                    if(right.subtype==1) rightVal=truncate(parseFloat(rightVal));

                    if(left.subtype==0 || right.subtype==0){
                        leftVal=""+leftVal;
                        rightVal=""+rightVal;
                    }

                    var value=0;
                    switch(block.value){ //==, >, <, >=, <=, !=
                        case '==':  value=leftVal==rightVal?1:0; break;
                        case '!=':  value=leftVal!=rightVal?1:0; break;
                        case '>=':  value=leftVal>=rightVal?1:0; break;
                        case '<=':  value=leftVal<=rightVal?1:0; break;
                        case '>' :  value=leftVal> rightVal?1:0; break;
                        case '<' :  value=leftVal< rightVal?1:0; break;
                    }
                    return {type:3, subtype:1, value};
            }
            break;
        case 1: //SingleSided Operator
            switch(block.value){
                case "++": case "--":
                    var actingOn;
                    var pre = true;
                    if(block.right){
                        actingOn=block.right;
                    } else if(block.left){
                        actingOn=block.left
                        pre=false;
                    } else {
                        throw "Nothing to inc/dec-rement"
                    }

                    if(actingOn.type != 3 || actingOn.subtype !=2) throw "Cannot inc/dec-rement a non-variable"

                    var initial=interpret(actingOn,chip);

                    var value;
                    if(block.value=="++"){ //TODO change for strings!!
                        if(initial.subtype==0){
                            value = {type:initial.type, subtype:initial.subtype, value:initial.value};
                            value.value+=" ";
                        } else {
                            value = arith('+',initial,{type:3, subtype:1, value:1});
                        }
                    }else{
                        if(initial.subtype==0){
                            value = {type:initial.type, subtype:initial.subtype, value:initial.value};
                            if(value.value==""){//decrement on empty string
                                throw "#HALT INTERP: Empty String dec"
                            }
                            value.value= value.value.substring(0, value.value.length-1);
                        }else{
                            value = arith('-',initial,{type:3, subtype:1, value:1});
                        }
                    }
                    if(actingOn.value.startsWith(":")){
                        if(chip.localEnv.global[actingOn.value]){
                            chip.localEnv.global[actingOn.value] = value;
                            chip.localEnv.nextBroadcast[actingOn.value] = value;
                        } else {
                            throw `Global var ${actingOn.value} does not exist`
                        }
                    } else {
                        chip.localEnv.vars[actingOn.value] = value;
                    }
                    //TODO logging
                    return pre?value:initial;
                case "!":
                    var left = interpret(block.left,chip);
                    if(left.type!=3 || left.subtype!=1) throw "Tried to factorialize non-number";
                    return {type:3, subtype:1, value:factorial(left.value)};
            }
        case 2: //Bracket
            throw "Tried to interpret bracket";
        case 3: //Value
            switch(block.subtype){
                case 0: //String
                    return block;
                case 1: //Number
                    return block;
                case 2: //var
                    if(block.value.startsWith(":")){
                        if(chip.localEnv.global[block.value]){
                            return chip.localEnv.global[block.value]
                        } else {
                            throw `Global var ${block.value} does not exist`
                        }
                    } else {
                        if(!chip.localEnv.vars[block.value])chip.localEnv.vars[block.value]={type:3, subtype:1,value:0};
                        return chip.localEnv.vars[block.value];
                    }
                default:
                    throw "Value block with unknown subtype";
            }
            break;
        case 4: //Keyword
            switch(block.value){
                case "debugger":
                    var arg=interpret(block.right,chip);
                    console.log("Interpreter debugger tripped, argument evaluated as", arg);
                    debugger;
                    return {type:3, subtype:1, value:0};
                case "goto":
                    var nextLine = interpret(block.right,chip);
                    if(nextLine.type==3 && nextLine.subtype==1){
                        nextLine=Math.floor(parseFloat(nextLine.value));
                        if(nextLine>20) nextLine=20;
                        if(nextLine<1) nextLine=1;
                        chip.localEnv.nextLine = nextLine;
                        throw "#HALT INTERP: GOTO"
                    } else {
                        throw "Tried to goto non number"
                    }
                case "sin":
                case "cos":
                case "tan":
                    var arg=interpret(block.right,chip);
                    if(arg.type!=3 || arg.subtype!=1) throw "Cant do trig on a string"
                    return {type:3, subtype:1, value:truncate(Math[block.value](arg.value/180*Math.PI))};
                case "asin":
                case "acos":
                case "atan":
                    var arg=interpret(block.right,chip);
                    if(arg.type!=3 || arg.subtype!=1) throw "Cant do trig on a string"
                    return {type:3, subtype:1, value:truncate(Math[block.value](arg.value)/Math.PI*180)};
                case "sqrt":
                    var arg=interpret(block.right,chip);
                    if(arg.type!=3 || arg.subtype!=1) throw "Cant do sqrt on a string"
                    return {type:3, subtype:1, value:truncate(Math.sqrt(arg.value))};
                case "abs":
                    var arg=interpret(block.right,chip);
                    if(arg.type!=3 || arg.subtype!=1) throw "Cant do abs on a string"
                    return {type:3, subtype:1, value:truncate(Math.abs(arg.value))};
                case "and":
                    var left=interpret(block.left,chip);
                    var right=interpret(block.right,chip);
                    return (left.value!=0 && right.value!=0)?{type:3,subtype:1,value:1}:{type:3,subtype:1,value:0};
                case "or":
                    var left=interpret(block.left,chip);
                    var right=interpret(block.right,chip);
                    return (left.value!=0 || right.value!=0)?{type:3,subtype:1,value:1}:{type:3,subtype:1,value:0};
                case "if":
                    var cond=interpret(block.condition,chip);
                    if(cond.type==3 && cond.value!=0){
                        block.ifTrue.forEach(cmd=>{
                            interpret(cmd,chip);
                        })
                    } else if(block.ifFalse){
                        block.ifFalse.forEach(cmd=>{
                            interpret(cmd,chip);
                        })
                    }
                    return
            }
        case 5: //Comment
            return;

        default:
            throw "Unknown block type";
    }
    throw "block did not return!";
}

function truncate(number){
    //return Math[number>0?'floor':'ceil'](number*1000)/1000
    return Math[number>0?'floor':'ceil'](Math.round(number*100000)/100)/1000
    if(typeof number=="number"){
        if(number%1==0) return number;

        var num=""+number;
        var dp=num.indexOf(".");
        if(dp==-1 || num.length-dp<=4){
            return number;
        } else {
            return parseFloat(num.substring(0,dp+4))
        }
    }else{
        return number;
    }
}

function arith(op,left,right){
    var value;
    var subtype=1;
    switch(op){
        case '*':
            if(left.subtype!=1 || right.subtype!=1) throw "Tried to multiply non-number"
            value = truncate(parseFloat(left.value)) * truncate(parseFloat(right.value));
            break;
        case '^':
            if(left.subtype!=1 || right.subtype!=1) throw "Tried to exp non-number"
            value = Math.pow(truncate(parseFloat(left.value)),truncate(parseFloat(right.value)));
            break;
        case '/':
            if(left.subtype!=1 || right.subtype!=1) throw "Tried to div non-number"
            var right = truncate(parseFloat(right.value));
            if(right==0) throw "#HALT INTERP: div0";
            value = truncate(parseFloat(left.value)) /right;
            break;
        case '%':
            if(left.subtype!=1 || right.subtype!=1) throw "Tried to mod non-number"
            value = truncate(parseFloat(left.value)) % truncate(parseFloat(right.value));
            break;
        case '+':
            if(left.subtype!=1 || right.subtype!=1){
                value=left.value+right.value; subtype=0;
            } else {
                var lv=truncate(parseFloat(left.value));
                var rv=truncate(parseFloat(right.value));
                value = lv + rv;
            }
            break;
        case '-':
            if(right.subtype!=1|| (left && left.subtype!=1)){
                if(!left) throw "can't negate string"
                subtype=0;
                value = ""+left.value;
                var search = ""+right.value
                var index=value.lastIndexOf(search);
                if (index>-1) {
                    value = value.substring(0, index)+value.substring(index+search.length, value.length);
                }
            } else {
                if(left){
                    value = truncate(parseFloat(left.value)) - truncate(parseFloat(right.value));
                } else {
                    value = -truncate(parseFloat(right.value));
                }

            }
            break;
    }
    if(subtype==1) value=truncate(value);
    return {type:3, subtype, value}
}

function factorial(num){
    if (num < 0) return -1;
    if (num == 0) return 1;
    return (num * factorial(num - 1));
}

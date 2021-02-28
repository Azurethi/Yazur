"use strict";
module.exports=(lexed)=>{
    var ordered=bracket(lexed)
    var keyed = keywords(ordered);
    return keyed;
}

function keywords(ordered,linenumber=0){    //TODO parse keywords (if, then, else, end & goto) REM other "keywords" are considered functions
    var buffer = [[]]
    var depth = 0;
    for(var i=0; i<ordered.length; i++){
        var tok=ordered[i];
        if(tok.type==4){ //is a keyword
            switch(tok.value){  //TODO checks for malformed if statements
                case 'if':
                    depth++
                    buffer[depth] = [];
                    continue;
                case 'then':
                    buffer[depth-1].push({type:4, subtype:-1, condition: buffer.pop()[0]}); //TODO check that this buffer's length is 1
                    buffer[depth] = [];
                    continue;
                case 'else':
                    buffer[depth-1][buffer[depth-1].length-1].true = buffer.pop();
                    buffer[depth] = [];
                    continue;
                case 'end':
                    depth--;
                    if(buffer[depth][buffer[depth].length-1].true){
                        buffer[depth][buffer[depth].length-1].false = buffer.pop();
                    } else {
                        buffer[depth][buffer[depth].length-1].true = buffer.pop();
                    }
                    continue;
                
                case 'goto':
                    var next = ordered[++i];
                    if(next.type==-1) next = ordered[++i];
                    buffer[depth].push({type:4, subtype:-2, goto:next})
                    continue;
                default:    //TODO warn::if we hit a lone function (this would be pointless tho?)
                    buffer[depth].push(tok);
            }
        } else if(tok.type!=-1){ //ditch spacing
            buffer[depth].push(tok);
        }
    }
    if(buffer.depth>1) throw "Key buffer length issue";
    return buffer[0];
}

function bracket(lexed){
    var bracketBuff = [[]];
    var depth=0;
    lexed.forEach(lex=>{
        if(lex.type==2){
            if(lex.subtype==0){
                depth++;
                bracketBuff[depth] = [];
            }else if(lex.subtype==1){
                depth--;
                bracketBuff[depth].push(order(bracketBuff.pop()))
            }
        }else if(depth>0){
            if(lex.type!=-1){//remove spaces inside brackets
                bracketBuff[depth].push(lex);
            }
        }else{
            bracketBuff[depth].push(lex);
        }
    })
    if(bracketBuff.length>1) throw "bracketing error";
    return order(bracketBuff[0], true);
}


const opPrec = require('../modules/language/operatorPrecedence.json');
function order(lexed, last=false){  //TODO don't copy lexed?
    var ordered=[...lexed];

    for(var iop=0; iop<opPrec.length && ordered.length>1; iop++){
        var op=opPrec[iop];
        for(var i=0; i<ordered.length; i++){
            var lex=ordered[i];
            if(lex.value==op && !(lex.left||lex.right)){
                if(lex.type==1){
                    if(ordered[i-1].type==3 || (op=="!" && (ordered[i-1].left||ordered[i-1].right))){   //REM expand this definition if ! precedence changes
                        i=collapseTokens(ordered,i,true,false);                        
                    }else if(ordered[i+1].type==3){ //REM ^
                        if(op=="!") throw "Weird factorial position"; //TODO warn or add seperate section
                        i=collapseTokens(ordered,i,false,true);    
                    }else{
                        //throw "Operand error"
                    }
                } else if(lex.type==4){ //Function
                    i=collapseTokens(ordered,i,false,true); 
                } else {
                    //TODO checks & warns
                    if(op=="-" && !(ordered[i-1].type==3 || ordered[i-1].type==2 || ordered[i-1].left || ordered[i-1].right)){
                        ordered[i].type=1;
                        ordered[i].subtype=3;
                        i=collapseTokens(ordered,i,false,true); 
                    } else if(iop!=2){  //ignore the 3rd - prec, since it's meant only for negation
                        i=collapseTokens(ordered,i,true,true);
                    }
                }
            }
        }
    }
    if(last){
        return ordered;
    } else {
        if(ordered.length>1) throw "Order length exception"//check if root of tree
        return ordered[0];
    }
}

function collapseTokens(ordered, i, left, right){
    var overwrite=1;
    var leftOff=0;

    if(left){
        left=ordered[i-1];
        if(left.type==-1){
            left=ordered[i-2];
            overwrite++;
            leftOff++;
        }
        overwrite++;
        leftOff++;
    }

    if(right){
        right=ordered[i+1];
        if(right.type==-1){
            right=ordered[i+2];
            overwrite++;
        }
        overwrite++
    }
    
    var t = ordered[i];
    t.left = left;
    t.right = right;
    i-=leftOff;
    ordered.splice(i,overwrite,t)
    return i;
}
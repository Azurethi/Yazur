"use strict";

const PRIO_DEBUG = false;


import opPrec from './lang/operatorPrecedence';
const l = Object.keys(opPrec).length;

export default function parse(lexed){

    /*REMOVE*//*REMOVE*/
    if(PRIO_DEBUG){
        var stringBuilder=[];
        lexed.forEach(tok=>{stringBuilder.push(tok.type>=0?tok.value:" ")});
        var codeStr=stringBuilder.join("");
    }
    /*REMOVE*//*REMOVE*/

    var depth = 0;
    var ifDepth = 0;
    var priority = [];
    var offsets = [];
    for(var i=0; i<lexed.length; i++){
        offsets[i] = 0;
        var val = lexed[i].value;
        var typ = lexed[i].type;
        var styp = lexed[i].subtype;
        if(typ==2 && styp==0) depth+=l;
        if(typ!=3 && typ!=-1 && typ!=2 /*&& typ!=5 && typ!=4*/){  //Dont prioritise values, whitespace, brackets, comments or keywords
            var prev=(i-1)>0?lexed[i-1]:{type:-2};
            if(prev.type==-1) prev=(i-2)>0?lexed[i-2]:{type:-2};
            if(val=="-"){
                if(!(prev.type==3 || (prev.type==2 && prev.subtype==1) || prev.type==1)){   //if - op & lefthand not return or == value
                    //priority[i]={p:l-2/*opPrec['!']-1*/+depth+ifDepth+2*l, i, /*REMOVE*/val}; //is negation op, so higher prec
                    priority[i]={
                        p:(3*l-2+depth+ifDepth)*lexed.length-i,   //is negation op, so higher prec
                        i, 
                        /*REMOVE*/val
                    };
                    lexed[i]['negate'] = true;
                } else {
                    //give subtract same priority as +
                    //priority[i]={p:l-opPrec["+"]+depth+ifDepth+2*l- i/lexed.length/2, i, /*REMOVE*/val};
                    priority[i]={
                        p:(3*l-opPrec["+"]+depth+ifDepth)*lexed.length-i,
                        i, 
                        /*REMOVE*/val
                    };
                }
            } else {
                if(typ==4){
                    if(val=="goto"){
                        //priority[i]={p:depth+ifDepth+l, i, /*REMOVE*/val};
                        priority[i]={
                            p:(l+depth+ifDepth)*lexed.length+i,
                            i,
                            /*REMOVE*/val
                        };
                    } else if(val=="if"){
                        ifDepth++;
                        //priority[i]={p:depth+ifDepth+i/lexed.length, i, /*REMOVE*/val}
                        priority[i]={
                            p:(depth+ifDepth)*lexed.length+i,
                            i,
                            /*REMOVE*/val
                        };
                    }else{
                        //priority[i]={p:l-opPrec[val]+depth+ifDepth+2*l, i, /*REMOVE*/val};
                        priority[i]={
                            p:(3*l-opPrec[val]+depth+ifDepth)*lexed.length-i,
                            i, 
                            /*REMOVE*/val
                        };
                    }
                    lexed[i].ifDepth==ifDepth;
                    if(val=="end"){
                        ifDepth--;
                    }
                } else {
                    //var assocBuf = i/lexed.length/2;
                    //if(typ==0 && val=="^") assocBuf=-assocBuf;
                    //priority[i]={p:l-opPrec[val]+depth+ifDepth+2*l-assocBuf, i, /*REMOVE*/val};
                    priority[i]={
                        p:(3*l-opPrec[val]+depth+ifDepth)*lexed.length-((typ==0 && val=="^")?-i:i),
                        i, 
                        /*REMOVE*/val
                    };
                } 
            }
        } else if(typ==3) { //Need type==2?
            
            //priority[i]={p:l-opPrec['++']+depth+ifDepth+3*l,i, /*REMOVE*/val};
            priority[i]={
                p:(4*l-opPrec["++"]+depth+ifDepth)*lexed.length,
                i, 
                /*REMOVE*/val
            };
        }
        if(typ==2 && styp==1) depth-=l;
    }
    //depth==o check\



    priority.sort((a,b)=>(b.p-a.p));

    /*REMOVE*/ if(PRIO_DEBUG) console.log(priority)
    /*REMOVE*/ if(PRIO_DEBUG) console.log(codeStr);
    priority.forEach((v,i)=>{
        if(v.p<0)return;

        var ti = v.i;
        v.i -=offsets[v.i];
        var tok = lexed[v.i];

        /*REMOVE*/ /*REMOVE*/
        if(PRIO_DEBUG && tok.type!=3){
            if(tok.type==3) return;
            var char = tok.pos.c;
            var str=""
            for(var i=0; i<char; i++) str+=" ";
            console.log(`${str}${v.val}(${v.p})`);
        }
        /*REMOVE*/ /*REMOVE*/
        
        if(tok.type==0){
            collapseTokens(lexed,v.i,tok.negate?false:true,true,offsets,ti);
        }else if(tok.type==1){  //singlesided
            if(tok.subtype==0){ //!
                collapseTokens(lexed,v.i,true,false,offsets,ti);
            }else{ //++ or --
                var left=v.i-1>=0?lexed[v.i-1]:{type:-2};
                var right=v.i+1<lexed.length?lexed[v.i+1]:{type:-2};
                if(left.type==-1) left=lexed[v.i-2];
                if(right.type==-1) right=lexed[v.i+2];
                
                if(left.type==3 && left.subtype==2){
                    collapseTokens(lexed,v.i,true,false,offsets,ti);
                }else if(right.type==3 && right.subtype==2){
                    collapseTokens(lexed,v.i,false,true,offsets,ti);
                }else{
                    throw `Singleside token error! ${v.i}:${JSON.stringify(tok)}` 
                }
            }
        }else if(tok.type==4){  //sin cos ...
            if(!['if','then','else','end','and','or'].includes(tok.value)){
                collapseTokens(lexed,v.i,false,true,offsets,ti);
            }else if(tok.value=="and" || tok.value=="or"){
                collapseTokens(lexed,v.i,true,true,offsets,ti);
            }else if(tok.value=="if"){
                collapseIf(lexed,v.i)//TODO
            }
        }else if(tok.type==3){
            collapseTokens(lexed,v.i,false,false,offsets,ti);
        }
    })

    /*REMOVE*//*REMOVE*/
    if(PRIO_DEBUG) {
        console.log("--------------------------");
        console.log();
    }
    /*REMOVE*//*REMOVE*/ 

    return lexed;
}


function collapseIf(lexed, i){
    var ovrinfo={overwrite:1}
    //Start at if, grab to then, grab to else/end, (grab to end)
    var cond = grabRight(lexed,i,ovrinfo);
    var thenCheck=grabRight(lexed,i+ovrinfo.overwrite,ovrinfo);
    if(thenCheck.type==4 && thenCheck.value=="then"){
        var process={ifFalse:[], ifTrue:[]};
        var cproc="ifTrue";
        var endedClean=false;
        do{
            var cur = lexed[i+ ++ovrinfo.overwrite]
            if(cur.type==4 && cur.value=="else"){
                cproc="ifFalse";
            } else if(cur.type==4 && cur.value=="end"){
                endedClean=true;
                ovrinfo.overwrite++
                break;
            } else {
                process[cproc].push(cur);
            }
        }while(i+ovrinfo.overwrite<lexed.length);
        if(!endedClean) throw "Missing end!"
        
        var t = lexed[i];
        t.condition=cond;
        t.ifTrue=process.ifTrue;
        t.ifFalse=process.ifFalse;
        lexed.splice(i,ovrinfo.overwrite,t)
    } else {
        throw "Malformed condition";
    }
    return;
}

//TODO check i+1 exist before r check
function grabRight(lexed,i,ovrinfo){
    var right=lexed[i+1];
    if(right.type==-1){
        right=lexed[i+2];
        ovrinfo.overwrite++;
    }
    ovrinfo.overwrite++
    return right;
}

//TODO check i-1 & i+1 exist before l/r checks
function collapseTokens(ordered, i, left, right, offsets, i_noOff){
    var overwrite=1;
    var leftOff=0;
    var ri=0,li=0;
    if(left){
        left=ordered[i-++li];
        if(left.type==-1){
            left=ordered[i-++li];
            overwrite++;
            leftOff++;
        }
        overwrite++;
        leftOff++;
    }

    if(right){
        right=ordered[i+ ++ri];
        if(right.type==-1){
            right=ordered[i+ ++ri];
            overwrite++;
        }
        overwrite++
    }

    if(
        ( //bracket on left "(" or "( "
            i>0 && ordered[i- ++li] && //if anything on left
            (
                (//is bracket OR
                    ordered[i-li].type==2 && //bracket
                    ordered[i-li].subtype==0 //specifically opening bracket
                ) || 
                (
                    ordered[i-li].type==-1 && //is space AND
                    (
                        i>1 && ordered[i- ++li] && //Something 2 spaces left
                        (
                            ordered[i-li].type==2 &&   //is bracket
                            ordered[i-li].subtype==0 //specifically opening bracket
                        )
                    )
                )
            )
        ) && ( //bracket on right
            i<ordered.length-1 && ordered[i+ ++ri] && //anything on right
            (
                (   //Is bracket OR
                    ordered[i+ri].type==2 && //bracket
                    ordered[i+ri].subtype==1 //specifically closing bracket
                ) || 
                (
                    ordered[i+ri].type==-1 && //Is space AND
                    (
                        i<ordered.length-2 && ordered[i+ ++ri] && (  //something 2 spaces right
                            ordered[i+ri].type==2 && //is bracket
                            ordered[i+ri].subtype==1 //specifically closing bracket
                        )
                    )
                )
            )
        )
    ){  
        leftOff=li;
        overwrite=li+ri+1
    }
    
    var t = ordered[i];
    if(t.type!=3){
        t.left = left;
        t.right = right;
    }
    //console.log(`Left:  ${left.value}`);
    //console.log(`Right: ${right.value}`);
    i-=leftOff;
    ordered.splice(i,overwrite,t)
    if(overwrite>1){
        for(var j=i_noOff+1;j<offsets.length;j++){
            offsets[j]+=overwrite-1;
        }
    }
    return i;
}

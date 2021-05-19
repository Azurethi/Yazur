"use strict";
import keys from './lang/keywords';

export function lex(line,linenumber=0){   //TODO add more info for exceptions (eg. line number)
    var chars = [...line];
    var lexed = [];
    proc:for(var i=0; i<chars.length; i++){
        var c = chars[i];
        if(c==' '||c=="\n"||c=="\t"){   //this should only be one line, so ignore extra tabs & newlines
            if(lexed.length>0 && lexed[lexed.length-1].type!=-1){
                lexed.push({type:-1, len:1,pos:{l:linenumber,c:i}});  //TODO maybe add length field?
            } else if(lexed[lexed.length-1].type==-1){
                lexed[lexed.length-1].len++;
            }
            continue;
        }else if(c.match(/[\+-\/\*><\^=%!]/)){//Type 0/1
            var prev=lexed.length>0?lexed[lexed.length-1]:{type:-1};
            if(c=="="){ //subtype 1 | 2
                if(prev.type==0){
                    if(prev.subtype==0){
                        lexed[lexed.length-1]={type:0, subtype:1, value:`${prev.value}=`, pos:{l:linenumber,c:i-1}}
                    }else if(prev.value.match(/^[><=]$/)){
                        lexed[lexed.length-1]={type:0, subtype:2, value:`${prev.value}=`, pos:{l:linenumber,c:i-1}}
                    }else{
                        //This should never be called
                        throw "Unexpected operator placement"
                        lexed.push({type:0, subtype:1, value:"="});
                    }
                }else if(prev.value=="!"){
                    lexed[lexed.length-1]={type:0, subtype:2, value:`!=`, pos:{l:linenumber,c:i-1}}
                } else {
                    lexed.push({type:0, subtype:1, value:"=", pos:{l:linenumber,c:i}});
                }
            }else if(c=="!"){ //subtype 3
                lexed.push({type:1, subtype:0, value:"!", pos:{l:linenumber,c:i}});
            }else if(c.match(/[><]/)){ //subtype 2
                lexed.push({type:0, subtype:2, value:c, pos:{l:linenumber,c:i}})
            }else{  //subtype 0
                //+ 0 ^ % * /
                if(prev.value == c && c.match(/[+/-]/)){
                    if(c=="/"){ //comment
                        //delete lexed[lexed.length-1];
                        var comment="//";
                        var pos = i-1;
                        while(++i<chars.length){
                            comment+=chars[i];
                        }
                        lexed[lexed.length-1]={type:5, subtype:0, value:comment, pos:{l:linenumber,c:pos}};
                        break proc;
                    }else{
                        //if(lexed[lexed.length-2].type!=3 && lexed[lexed.length-2].type!=0){
                        //    lexed.push({type:0, subtype:0, value:c, pos:{l:linenumber,c:i}});
                        //} else {
                            lexed[lexed.length-1]={type:1, subtype:c=="+"?2:1, value:c=="+"?"++":"--",pos:{l:linenumber,c:i-1}};
                        //}
                    }
                } else {
                    lexed.push({type:0, subtype:0, value:c,pos:{l:linenumber,c:i}});
                }  
            }
        }else if([...'()'].includes(c)){
            lexed.push({type:2, subtype:c=="("?0:1, value:c,pos:{l:linenumber,c:i}})
        }else if(c=='"'){
            
            var value = ""
            var pos = i;
            while(++i<chars.length && chars[i]!='"') value+=chars[i]
            if(chars[i]!='"') throw "No end of string!" //TODO better exceptions with lines etc
            lexed.push({type:3, subtype:0, value,pos:{l:linenumber,c:pos}});

        }else if(c.match(/[0-9]/)){
            var value=c;
            var pos=i;
            while(++i<chars.length && chars[i].match(/[.0-9]/)) value+=chars[i]
            i--
            lexed.push({type:3, subtype:1, value,pos:{l:linenumber,c:pos}});
        }else if(c.match(/[:_a-zA-Z]/)){
            var value=c;
            var pos=i;
            while(++i<chars.length && chars[i].match(/[_A-Za-z0-9]/)) value+=chars[i]  //Allow numvers after first char of vars?
            i--
            value=value.toLowerCase();  //TODO notify user when this is called (or just edit the variable on the line)
            var keywrd=keys.indexOf(value)
            if(keywrd!=-1){
                lexed.push({type:4,subtype:keywrd, value,pos:{l:linenumber,c:pos}});
            } else {
                lexed.push({type:3, subtype:2, value,pos:{l:linenumber,c:pos}});
            }
        }else{
            throw `Unexpected Char ${c} in line:${linenumber} @ char ${i}`
        }
    }
    return lexed;
}

export function getClasses(lexedLineElement){
    let {type, subtype} = lexedLineElement;

    if(!subtype) subtype = 0;

    let error = "unknown_token_class_(this_is_a_bug)"

    let keywords = keys.map(keyword => `keyword ${keyword}`);

    try{
        let classes = [
            [error,error,
                "whitespace"
            ],
            [error,error,
                "operator arithmetic",
                "operator assignment",
                "operator comparison"
            ],
            [error,error,
                "operator factorial",
                "operator decrement",
                "operator increment",
                "operator negate"               //only when parsed
            ],
            [error,error,
                "bracket open",
                "bracket close"
            ],
            [error,error,
                "constant string",
                "constant number",
                "variable"
            ],
            [
                "keyword goto _parsed",         //only when parsed
                "keyword conditional _parsed",  //only when parsed

                ...keywords
            ]
        ][type+1][subtype+2];
        return classes;
    }catch(e){
        return error
    }
}

//lexer.generateSpans()
export function generateSpans(originalLine, lexedLine){
    let lineBuilder = [];
    let usedPos = 0;
    lexedLine.forEach(token=>{
        let classes = getClasses(token);
        let pos = token.pos.c
        let len = token.len || token.value.length;

        if(token.type == 3 && token.subtype == 0) len+=2 //lexer removes quote characters

        //add stuff before this token to line builder (if there is any)
        if(usedPos!=pos){
            lineBuilder.push(originalLine.slice(usedPos, pos));
            usedPos=pos
        }
        
        //add token span
        lineBuilder.push(`<span class="${classes}">`);

        //token content
        lineBuilder.push(originalLine.slice(usedPos, usedPos+len));
        usedPos+=len
        
        //span end
        lineBuilder.push(`</span>`);
    });

    return lineBuilder.join("");
}
"use strict";
console.log("Starting line test:");
const fs = require('fs');
var tests=[
   'c=i---i d=3*((c>1)+(c>4)+(c>7)) n+=(d+(c>d)-(c<d))*10^j++ goto 2+(c<0) //a comment',
   'goto a+b goto(a+b) goto (a+b)',
   'thisisavar       = sin(  cos(    tan(   b  +  1234     ^   2)))',
   'a=100^-1',
   'if k==10 then o+="A" goto 2 else if k==11 then o+="B" goto 2 end end',
   "testValue   = 10 * 5^20",
   ":a=11.0:b=17.0 t=atan(:b/:a)",
   "test=10^2!",
   "test=10^10^10",
   "test= a>b and 10>4",
   "a=10>3 b=a b++ c=++x d=x++",
   "a=sin(90)"
]
var line = tests[11];

var lex = require('./modules/yolol/lex');
var parse = require('./modules/yolol/parse');

console.log(line)

var lexed=lex(line);
fs.writeFileSync(`${__dirname}/output/lexer.json`,JSON.stringify(lexed,null,4));
console.log("Wrote lexer output")

var parsed = parse(lexed);
fs.writeFileSync(`${__dirname}/output/parser.json`,JSON.stringify(parsed,null,4));
console.log("Wrote parser output")




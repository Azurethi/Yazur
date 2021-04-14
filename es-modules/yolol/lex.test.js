import lex from './lex'
const testSuite = require('testing/suite');

console.log(lex);

//warning, setting this to true will completely invalidate this test.
const UPDATE_EXPECTS=false;


testSuite.forEachBasicTest((testData)=>{

    if(UPDATE_EXPECTS){
        var lexed = [];
        testData.code.forEach((line, i)=>{
            lexed.push(lex(line, i))
        });

        testSuite.updateExpects(testData.name, {
            lex:lexed,
            parse:testData.expect.parse
        });
    }
    

    test(`Lexing: basic_test: ${testData.name}`,()=>{
        testData.code.forEach((line, i)=>{
            expect(lex(line, i)).toStrictEqual(testData.expect.lex[i]);
        });
    });

    
});

if(UPDATE_EXPECTS)  fail("UPDATE_EXPECTS WAS SET TO TRUE");
import parse from './parse'
const testSuite = require('testing/suite');


//warning, setting this to true will completely invalidate this test.
const UPDATE_EXPECTS=false;

testSuite.forEachBasicTest((testData)=>{

    if(UPDATE_EXPECTS){
        var lexed = JSON.parse(JSON.stringify(testData.expect.lex))
        var parsed = [];
        testData.expect.lex.forEach((line, i)=>{
            parsed.push(parse(line))
        });

        testSuite.updateExpects(testData.name, {
            lex:lexed,
            parse:parsed
        });
    }
    
    test(`Parsing: basic_test: ${testData.name}`,()=>{
        testData.expect.lex.forEach((line, i)=>{
            expect(parse(line)).toStrictEqual(testData.expect.parse[i]);
        });
    });

});

if(UPDATE_EXPECTS) fail("UPDATE_EXPECTS WAS SET TO TRUE");
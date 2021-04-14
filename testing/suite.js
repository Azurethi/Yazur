const fs = require('fs');

const ALLOW_UPDATES = true;

module.exports.forEachBasicTest=(testFunc)=>{
    var testNames = fs.readdirSync(`${__dirname}/basic_tests`);
    if(testNames.length==0) throw "No tests loaded";
    testNames.forEach(name=>{
        if(name.startsWith("skip=")){
            console.warn(`Skipping basic test: ${name.replace("skip=","")}`);
            return;
        }
        testFunc({
            name,
            code:fs.readFileSync(`${__dirname}/basic_tests/${name}/code.yolol`).toString().replace(/\r\n/g,"\n").split("\n"),
            IO:require(`${__dirname}/basic_tests/${name}/IO.json`),
            expect:require(`${__dirname}/basic_tests/${name}/expect.json`)
        });
    });
};


module.exports.updateExpects=(name, expect)=>{
    //this function should never be called during normal testing
    console[ALLOW_UPDATES?"warn":"error"](`TESTSUITE Update expects was called for ${name}`);
    fs.writeFileSync(`${__dirname}/basic_tests/${name}/expect.json`,JSON.stringify(expect, null, 4));
};

module.exports.addFields=(env, IO)=>{
    var iFields = Object.keys(IO.in[0]);
    var oFields = Object.keys(IO.out[0]);
    
    var fields = [...iFields];
    oFields.forEach(of=>{
        if(!fields.includes(of)) fields.push(of);
    });

    fields.forEach(field=>{
        env[":"+field]={type:3, subtype:(typeof IO.out[0][field])=="string"?0:1, value:0};
    })
};
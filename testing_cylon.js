const testing = require("./testing");
const fs = require('fs');
var data = require("./cylon_challenges/data.json");


var P = testing.perfStruct();

var failed = [];

data.forEach((challenge,chali) => {
    if(challenge!=null){
        console.log(`CYLON CHALLENGE ${challenge.ID} of ${data.length}: ${challenge.Name}`);
        //console.log(` > ${challenge.Description}`);
        console.log(`> ${challenge.sols.length} solutions to test...`);

        var IO={in:JSON.parse(challenge.Inputs), out:JSON.parse(challenge.Outputs)}
        challenge.sols.forEach((sol,soli)=>{
            console.log(`\t Starting solution ${soli}`);
            var code=sol.Yolol.split('\n');
            try{
                testing.run(P,code,IO);
            }catch(e){
                console.error(`\t\tFailed. ${e}`)
                failed.push({chali, soli, e});
                
                var path = `./cylon_challenges/failed/Challenge_${chali}`;
                if (!fs.existsSync(path)) fs.mkdirSync(path);
                fs.writeFileSync(`${path}/failedSolution_${soli}.yolol`, `${sol.Yolol}\n\n//Submission to Cylon challenge ${challenge.Name} (${challenge.ID})\n\n//${challenge.Description.replace('\n','\n//')}\n\n//Fail exception: "${e}"\n\n`);
                
                console.log("\t\t\tExported fail info");
            }
        });

        console.log("");
    } 
});

testing.calcPerf(P);
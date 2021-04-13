const sqlite3 = require('sqlite3').verbose();

var chal_data=[];

var db = new sqlite3.Database('.\\database.sqlite',sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error(err.message);
      throw err;
    }
    console.log('DB opened');
});

db.all("select name from sqlite_master where type='table'", (err, tables)=>{
    console.log("Avail tables:")
    tables.forEach(a=>console.log(`\t${a.name}`));
});


db.all("select * from Challenges",(err,chals)=>{
    chals.forEach(chal=>{
        chal_data[chal.ID]=chal;
    });
    console.log(`Loaded ${chal_data.length} challenges`);
    db.all("select * from Solutions", (err, sols)=>{
        sols.forEach(sol=>{
            if(sol!=null){
                if(!chal_data[sol.ChallengeId]["sols"]) chal_data[sol.ChallengeId]["sols"]=[];
                chal_data[sol.ChallengeId].sols.push(sol);
            }
        });
        require('fs').writeFileSync(".\\data.json", JSON.stringify(chal_data,false,4));
        console.log("wrote data.json");
    });
});





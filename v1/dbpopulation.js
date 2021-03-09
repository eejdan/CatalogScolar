
require('dotenv').config();

const mysql = require('mysql');

const hash = require('hash.js');


var con = mysql.createConnection({
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPASS,
    database: process.env.DBNAME
})
setTimeout(() => {
    con.connect((err) => {
        if(err) throw err;
        passmain = hash.sha256().update("passmain").digest('hex');
        passp1 = hash.sha256().update("passp1").digest('hex');
        passp2 = hash.sha256().update("passp2").digest('hex');
        sql = `INSERT INTO \`elev\` (\`numar_matricol\`,\`password\`, \`p1_password\`, \`p2_password\`) VALUES ('0', '${passmain}', '${passp1}', '${passp2}')`;
        con.query(sql, (err, result, fields) => {
            if(err) throw err;
        })
        console.log("Db populated");
    })
}, 5000);
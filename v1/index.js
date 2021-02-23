//Daniel Birleanu 2021 Copyright. All rights reserved.
console.log('Daniel Birleanu 2021 Copyright. All rights reserved.');
require('dotenv').config();

init();

const express = require("express");
const hash = require('hash.js');
const cookieParser = require("cookie-parser");
const bodyParser = require('body-parser');
const { render } = require("ejs");

var mysql = require('mysql')

var app = express();
var sqlPool = mysql.createPool({
    waitForConnections: true,
    connectionLimit : 10,
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPASS,
    database: process.env.DBNAME
})

app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')

app.use(express.static('public'))
app.use(cookieParser(process.env.COOKIESECRET))

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/', async (req,res) => {
    var returned = false;
    let renderParams = {
        "parts": [
            {"name": "logbox", "dir":"enclosure/part/logbox", "styleDir": "logbox.css"}
        ]
    }
    if(!req.signedCookies.sid) {
        returned = true;
        return res.render('index', renderParams);
    }
    sqlPool.getConnection((err, con) => {
        if(err) { return res.render('index', renderParams);  }
        validateSidSql = `SELECT * FROM session WHERE sid='${req.signedCookies.sid}'`;
        con.query(validateSidSql, (err, result, fields) => {
            if(err) { returned = true; return res.render('index', renderParams);  }
            if(!result.length) {
                res.clearCookie('sid');
                returned = true;
                return res.render('index', renderParams);
            }
            renderParams = {
                "parts": [
                    {"name": "elev", "dir":"enclosure/part/elev", "styleDir": "elev.css"}
                ]
            }
            let date = new Date(result[0].last);
            return res.render('index', renderParams);
        })
        if(returned) { return; }
    })
})
//login almost done
app.post('/login', (req,res) => {
    console.log(req.body.password);
    var returned = false;
    sqlPool.getConnection((err, con) => {
        if(err) return console.log(err);
        var correctPass = false;
        getUserSql = `SELECT * FROM \`user\` WHERE numar_matricol='${req.body.matricol}'`;
        con.query(getUserSql,  (err, result, fields) => {
            if(err) return console.log(err);
            if(result.length > 0) {
                if(result[0]) {
                    let phash = shaenc(req.body.password);
                    switch(phash) {
                        case result[0].password:
                            correctPass = true; break;
                        case result[0].p1_password:
                            correctPass = true; break;
                        case result[0].p2_password:
                            correctPass = true; break;
                    }
                }
            } 
            if(!correctPass) {
                returned = true;
                return res.redirect('/');
            }
            let cookie = '';
            {
                let alpha = 'abcdefg';
                for(let i = 0;i<16;i++) {
                    cookie += alpha[Math.floor(Math.random() * 7)];
                }
                cookie = shaenc(cookie);
            }
            let makeSessionSql = `INSERT INTO \`session\` (\`numar_matricol\`, \`sid\`,\`clasa\`) VALUES ('${req.body.matricol}', '${cookie}', '${result[0].clasa}')`;
            con.query(makeSessionSql, async (err, result, fields) => {
                if(err) throw err;    
                await res.cookie('sid', cookie, { signed: true });
                return res.redirect('/');
            })
            let makeSession
        })
        if(returned) {return;}
    })
})
//logout done
app.post('/logout', (req,res) => {
    res.clearCookie('sid');
    console.log('user logout '+ req.signedCookies.sid); 
    sqlPool.getConnection((err, con) => {
        if(err) return console.log(err);
        con.query(`DELETE FROM session WHERE sid='${req.signedCookies.sid}'`, (err, result, fields) => {
            if(err) return console.log(err);    
            res.redirect('/');
        })
    })
})
//FIX THIS
app.post('/elev/', (req,res) => { //neterminat //de aici se preiau in forma JSON informatiile despre elev, note, absente
    if(!req.signedCookies.sid) {
        return res.send(401);
    }
    let build = {}
    sqlPool.getConnection((err, con) => {
        if(err) return console.log(err);
        let validateSidSql = `SELECT * FROM session WHERE sid='${req.signedCookies.sid}'`;
        con.query(validateSidSql, (err, result, fields) => {
            if(err) { console.log(err); return res.send(500)  }
            if(!result.length) {
                res.clearCookie(404)
                return res.send(404);
            }
            refreshSid(req.signedCookies.sid);
            let build = {
                "materii": []
            }
            let matricol = result[0].numar_matricol;
            let getElevInfoSql = `SELECT nume,prenume,clasa FROM \`elev\` WHERE numar_matricol='${matricol}'`;
            con.query(getElevInfoSql, (err, result, fields) => {
                if(err) { console.log(err); res.send(500); }
                let getElevClasaSql = `SELECT * FROM \`clasa\` WHERE clasa='${result[0].clasa}'`;
                con.query(getElevClasaSql, (err, result, fields) => {
                    if(err) { console.log(err); res.send(500); }
                    if(!result.length) { res.send(400); return;}
                    result.forEach((sres) => {
                        build.materii[sres.materie]={"nume": sres.materie, "profesor": sres.profesor, "note": [], "abs": []}
                    })
                    let getElevNotaSql = `SELECT * FROM \`nota\` WHERE numar_matricol=${matricol}`;
                    con.query(getElevNotaSql, (err, result, field) => {
                        if(err) { console.log(err); return res.send(500); }
                        if(!result.length) {
                            return res.send(build)
                        }
                        result.forEach((sres)=> {
                            build.materii[sres.disciplina].note[build.materii[sres.disciplina].note.length]={"nota": sres.nota, "data": sres.data }
                        })
                        let getElevAbsentaSql = `SELECT * FROM \`absenta\` WHERE numar_matricol=${matricol}`;
                        con.query(getElevAbsentaSql, (err, result, fields) => {
                            if(err) { console.log(err); return res.send(500); }
                            if(!result.length) {
                                return res.send(build)
                            }
                            result.forEach((sres) => {
                                build.materii[sres.disciplina].abs[build.materii[sres.disciplina].abs.length] = {"materie": sres.disciplina, "data": sres.data};
                            })
                            return res.send(build);
                        })
                    })
                })
            })
        })
    })
}) 

// De facut: Interfata profesor si administrator sistem



app.listen(3030);

async function init() {
    setTimeout(cleanSids, 50000)
}
logErrVault = [];
function logFailsafe(type) {
    logErrVault[logErrVault.length] = { 
        "type": type,
        "context": context
    };
}
function shaenc(str) {
    return hash.sha256().update(str).digest('hex');
}
async function refreshSid(lsid) {
    sqlPool.getConnection((err, con) => {
        if(err) return console.log(err);
        let updateSidSql = `UPDATE \`session\` SET data='${buildDbDate()}' WHERE sid='${lsid}'`;
        con.query(updateSidSql, (err, result, fields) => { 
            if(err) return console.log(err);
        })
    })  
}
async function cleanSids() {
    sqlPool.getConnection((err, con) => {
        if(err) return console.log(err);
        let updateSidSql = `DELETE FROM \`session\` WHERE last < ${buildDbDate()}`;
        con.query(updateSidSql, (err, result, fields) => { 
            if(err) return console.log(err);
        })
    })
    console.log("Sids cleaned")
    setTimeout(cleanSids, 43200000)
}

function buildDbDate(a) {
    let basicDate = new Date();
    let mth = basicDate.getMonth()+1;
    if(mth<10) {
        mth = '0'+mth; 
    }
    let strDate = `${basicDate.getFullYear()}-${mth}-${basicDate.getDate()}`;
    return strDate;
}

//TODO: elev.ejs: remove onclick, add jquery event handlers instead


/* Notes:
Dates are managed by the web server.
Database dates are: YYYY-MM-DD
Absente si note : MM-DD


*/
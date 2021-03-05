//Daniel Birleanu 2021 Copyright. All rights reserved.
console.log('Daniel Birleanu 2021 Copyright. All rights reserved.');
require('dotenv').config();

init();

const express = require("express");
const hash = require('hash.js');
const cookieParser = require("cookie-parser");
const bodyParser = require('body-parser');
const { render } = require("ejs");
const http = require('http');
var mysql = require('mysql')
var proxy = require('express-http-proxy');
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
{
    let proxyIp = 'localhost:' + process.env.APIPORT;
    app.use('/api', proxy(proxyIp));
}
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


const apiForwardOptions = {
    host: 'localhost',
    port: process.env.APIPORT,
}

app.get('/', async (req,res) => {
    var returned = false;
    let renderParams = {
        "parts": [
            {"name": "logbox", "dir":"enclosure/part/logbox", "styleDir": "logbox.css"}
        ]
    }
    if(!req.signedCookies.sid) {
        return res.render('index', renderParams);
    }
    sqlPool.getConnection((err, con) => {
        if(err) { return res.render('index', renderParams);  }
        validateSidSql = `SELECT * FROM session WHERE sid='${req.signedCookies.sid}'`;
        con.query(validateSidSql, (err, result, fields) => {
            if(err) { return res.render('index', renderParams);  }
            if(!result.length) {
                res.clearCookie('sid');
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
    })
})
//login almost done
app.post('/login', (req,res) => {
    console.log(req.body);
    var currentForward = {
        ...apiForwardOptions,
        path: '/login',
        method: 'POST',
        headers: req.headers
    }
    let forwardReq = http.request(
        currentForward, pres => {
            pres.setEncoding('utf8');
            res.writeHead(pres.statusCode);
            pres.on('data', chunk => {
              res.write(chunk);
            });
            pres.on('close', () => {
              res.end();
            });
            pres.on('end', () => {
              res.end();
            });
            
        }
    ).on('error', e => {
        console.log(e.message);
        try {
          res.writeHead(500);
          res.write(e.message);
        } catch (e) { console.log(e); }
        res.end();
    });
    forwardReq.end();
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

app.listen(process.env.WEBPORT, () => { console.log("Web server pornit.")});

function init() {}

function shaenc(str) {
    return hash.sha256().update(str).digest('hex');
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
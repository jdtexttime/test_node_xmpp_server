var express = require('express');

var app = express();

var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended: true}));

/**********************************
 *
 * Config setup
 */

var db_server_port = 27017;
var db_server_host = "130.211.174.172";
var db_name = "apidbv1";

var db_url = "mongodb://"+db_server_host+":"+db_server_port+"/"+db_name;





app.get('/', function(req, res){
    res.status(200).json({"message":"welcome user!"});
});

// Nodejs encryption with CTR
var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = 'd6F3Efeq';

function encrypt(text){
    var cipher = crypto.createCipher(algorithm,password)
    var crypted = cipher.update(text,'utf8','hex')
    crypted += cipher.final('hex');
    return crypted;
}

function decrypt(text){
    var decipher = crypto.createDecipher(algorithm,password)
    var dec = decipher.update(text,'hex','utf8')
    dec += decipher.final('utf8');
    return dec;
}



// Register user
app.post('/register', function(req, res){


    var mclient = require("mongodb").MongoClient;
    // connect to db:
    mclient.connect(db_url, function(err, db){

        if( err ){
            return console.dir(err);
        }
        var users = db.collection('users');

        users.find({'login_id': req.body.login_id}).count(function(err, c){
            if( c > 0 ){
                res.status(409).json({
                    'login_id': req.body.login_id
                    , 'message': 'User already exists!'
                });
                db.close();
                return 0;
            }else{
                users.insertOne({
                    'login_id': req.body.login_id
                    , 'login_pass': encrypt(req.body.login_pass)
                }, function(err, doc){
                    if( err ){
                        return console.dir(err);
                    }

                    res.status(200).json({
                        'login_id': doc.ops[0].login_id
                        , 'key': doc.ops[0]._id
                    });
                    db.close();
                });
            }
        });

    });
});

// Login user
app.post('/login', function(req, res){
    var mclient = require("mongodb").MongoClient;
    // connect to db:
    mclient.connect(db_url, function(err, db){

        if( err ){
            return console.dir(err);
        }
        var users = db.collection('users');

        users.findOne({'login_id': req.body.login_id, 'login_pass': encrypt(req.body.login_pass)}, function(err, doc){
            if( err ) return consoel.dir(err);

            if( doc == null ){

                res.status(404).json({
                    'message': 'User not exists'
                });

            }else {
                res.status(200).json({
                    'message': 'user login success'
                    , 'key' : doc._id
                    , 'login_id': doc.login_id
                });
            }

            db.close();

        });
    });
});




var server = app.listen(3000, function(){
    console.log('running on port 3000');
});

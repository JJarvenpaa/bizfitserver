"use strict";


var http = require('http');
var https = require('https');
var cluster = require('cluster');
var os = require('os');
var numCPUs = os.cpus().length
var qs = require('querystring');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var async = require('async');
var dbversion=75;
var fs = require("fs");
var path = require('path');
var util = require('util');
var uuidv4 = require('uuid/v4');

//db.user.findOne({"_id":"atte.yliverronen@gmail.com"})
/*if (cluster.isMaster) 
{
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => 
  {
    console.log(`worker ${worker.process.pid} died`);
  });
} else 
{
  console.log(`Worker ${process.pid} started`);
  */








    var url = 'mongodb://127.0.0.1:27017/files';
   // var url ="mongodb://bizfitserverdb:loC4iF0b78j019bygn3ODtTTDr1M2x65xoLL3JHH7VWCZFq94NA6PrJgGk13ZrHEKUenzoW4jlPYHvQWNZPoog==@bizfitserverdb.documents.azure.com:10255/files?ssl=true&replicaSet=globaldb"
    var PORT = 8083;
    //const PORT = $PORT;
    
    
    GLOBAL.job="job";
    GLOBAL.userName="_id";
    GLOBAL.getSharedTrackers="getSharedTrackers";
    GLOBAL.sharedTrackers="SharedTrackers";
    var options = {
        key: fs.readFileSync('certs/server.CA.key'),
        cert: fs.readFileSync('certs/server.CA-signed.crt'),
        passphrase:'testi'
    };
    
    
    
    //We need a function which handles requests and sends responses
    function handleRequest(request, response) {
        var test;
       // console.log(request);
        console.log("perse");
        //console.log(request);
       // handlePayLoad(response);
        // TODO Better parameters for filtering out junk
        // requests to reduce workload as well as improve
        // stability and security.
        console.log(request.headers['filetype']);
        console.log(request.headers['filename']);
        console.log(request.headers['fileextension']);
        console.log(request.headers['fileid']);
        if (request.method == 'POST') {
            var body = [];

            request.on('data', function(data) {
                if(typeof request.headers["job"] === 'undefined')
                {
                    request.connection.destroy();
                }
                if(request.headers["job"]=="uploadfile")
                {
                    body.push(data);
                }
                else if(request.headers["job"]=="downloadfile")
                {
                     body += data;
                }
                else
                {
                    request.connection.destroy();
                }
                
                //console.log(data);
                // Too much POST data, kill the connection!
                // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
                //if (body.length > 1e6) {
                 //   request.connection.destroy();
                //}
            });
            
            request.on('end', function() 
            {
                
                
                if(request.headers["job"]=="uploadfile")
                {
                    body = Buffer.concat(body);
                    var fs = require('fs');
                    var path=request.headers['filetype']+'/'+request.headers['fileid']+'.'+request.headers['fileextension'];
                    MongoClient.connect(url, function(err, db)
                    {
                        assert.equal(err,null);
                        var uploadInfo={};
                        
                        uploadInfo['filetype']=request.headers['filetype'];
                        uploadInfo['fileid']=request.headers['fileid'];
                        uploadInfo['filename']=request.headers['filename'];
                        uploadInfo['fileextension']=request.headers['fileextension'];
                        uploadInfo['uploader']=request.headers['uploader'];
                        if(uploadInfo['filetype']=="profile")
                        {
                            var finder={};
                            finder['uploader']=uploadInfo['uploader'];
                            db.collection('files').update(finder, uploadInfo, { upsert: true });
                        }else{
                             db.collection('files').save(uploadInfo, {
                            w: 0
                            }, function(err, result) 
                            {
                                assert.equal(err,null);
                                console.log(result);
                                db.close();
                            });
                        }
                       
                    });
                    var wstream = fs.createWriteStream(path);
                    wstream.write(body);
                    //console.log(body);
                   /* try {
                        JSON.parse(body);
                    } catch (e) {
                        console.log(body);
                        response.write("failed");
                        response.end();
                        return;
                    }*/
                    //var post = JSON.parse(body);
                    handlePayLoadUploadFile(response);
                }
                else if(request.headers["job"]=="downloadfile")
                {
                    
                    if(request.headers['fileid'].lastIndexOf("http", 0) === 0){
                        var fs = require('fs');
                        http.get(request.headers['fileid'], response2 => {
                            var uuid=uuidv4();
                            var array=response2['headers']['content-type'].toString().split("/");
                            var nimi="temp_files/"+uuid+"."+array[array.length-1];
                            var file = fs.createWriteStream(nimi);
                            response2.pipe(file).on('finish', function() {
                                
                                //console.log(response2);
                                //console.log("perse");
                               // console.log(file);
                                var array2=request.headers['fileid'].toString().split("/");
                                
                                var information={};
                                information['fileid']=nimi;
                                information['orginalfilename']=array2[array2.length-1];
                                information['externalfile']=true;
                                information['fileextension']=array[array.length-1];
                                handlePayLoad(response,information)
                            });
                        });
                        
                    }else{
                        MongoClient.connect(url, function(err, db){
                        assert.equal(err,null);
                        var finder={};
                        console.log("fileid: "+request.headers['fileid']);
                        finder['filename']=request.headers['fileid'];
                        db.collection('files').findOne(finder,function(err, payload)
                        {
                            assert.equal(err,null);
                            console.log("naapur");
                            console.log(payload);
                            db.close();
                            handlePayLoad(response,payload);
                            });
                        });
                    }
                }
                //var testi=JSON.parse(body);
                //console.log(testi);
               
                
            });
        }
    }
    //Create a server
    var server = https.createServer(options,handleRequest);
    //var server = http.createServer(handleRequest);
    //Lets start our server
    //server.listen(PORT);
    server.listen(PORT,"0.0.0.0");
    //server.listen(PORT,$IP);
    function handlePayLoadUploadFile(response)
    {
        response.end("hoi");
        /*
        console.log("peepu");
        var filePath = path.join('picture', 'wall-small-greyish.png');
        var stat = fs.statSync(filePath);
        var img = fs.readFileSync(filePath);
        response.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-Length': stat.size,
            'Content-Disposition': "attachment; filename=picture.png"
        });
        
        var readStream = fs.createReadStream(filePath);
        //console.log(readStream);
        // We replaced all the event handlers with a simple call to readStream.pipe()
        readStream.pipe(response);*/
        //console.log(img.length);
        //var rs = fs.createReadStream(filePath);
        //util.pump(rs, response, function(err) {
        //    if(err) {
        //        throw err;
        //    }
        //});
    //        response.end(img, 'binary');
        
    
    }
    function handlePayLoad(response,payload)
    {
        console.log("peepu");
        console.log(typeof payload);
        if(payload === undefined || payload === null)
        {
            response.writeHead(200, {
                'Content-Type': 'application/octet-stream',
                //'Content-Length': stat.size,
                'Content-Disposition': "attachment; filename=picture.png",
                'filefound':'false'
            });
            response.end();
        }
        else if(payload['externalfile'] ==! undefined)
        {
            var filePath =payload['fileid'];
            var stat = fs.statSync(filePath);
            response.writeHead(200, {
                'Content-Type': 'application/octet-stream',
                'Content-Length': stat.size,
                'Content-Disposition': "attachment; filename=picture.png",
                'filefound':'true'
            });
            var readStream = fs.createReadStream(filePath);
            readStream.pipe(response).on('finish', function() {
                fs.unlinkSync(filePath);
            });
        }
        else
        {
            var filePath = path.join(payload['filetype'], payload['fileid']+'.'+payload['fileextension']);
            var stat = fs.statSync(filePath);
            response.writeHead(200, {
                'Content-Type': 'application/octet-stream',
                'Content-Length': stat.size,
                'Content-Disposition': "attachment; filename=picture.png",
                'filefound':'true'
            });
            
            var readStream = fs.createReadStream(filePath);
            //console.log(readStream);
            // We replaced all the event handlers with a simple call to readStream.pipe()
            readStream.pipe(response);
            
        }
       
        //console.log(img.length);
        //var rs = fs.createReadStream(filePath);
        //util.pump(rs, response, function(err) {
        //    if(err) {
        //        throw err;
        //    }
        //});
    //        response.end(img, 'binary');
        
    
    }

//}
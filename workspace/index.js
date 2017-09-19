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
var NodeJobs = require('Jobs');
var dbversion=75;
var fs = require("fs");



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





   
   

    var url = 'mongodb://127.0.0.1:27017/test';
    var cosmoOsote="mongodb://bizfitserverdb:loC4iF0b78j019bygn3ODtTTDr1M2x65xoLL3JHH7VWCZFq94NA6PrJgGk13ZrHEKUenzoW4jlPYHvQWNZPoog==@bizfitserverdb.documents.azure.com:10255/test?ssl=true&replicaSet=globaldb";
    var PORT = 8081;
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
    /*
     MongoClient.connect(cosmoOsote, function(err, db)
                {
                    NodeJobs.save(db,null,function(payload){
                        console.log(payload);
                        //handlePayLoad(response, payload);
                    });
                });
    
    */
    //We need a function which handles requests and sends responses
    function handleRequest(request, response) {
        var test;
    
        
       
        // TODO Better parameters for filtering out junk
        // requests to reduce workload as well as improve
        // stability and security.
        if (request.method == 'POST') {
            var body = '';
    
            request.on('data', function(data) {
                body += data;
                // Too much POST data, kill the connection!
                // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
                if (body.length > 1e6) {
                    request.connection.destroy();
                }
            });
            request.on('end', function() 
            {
                try {
                    JSON.parse(body);
                } catch (e) {
                    response.write("failed");
                    response.end();
                    return;
                }
                var post = JSON.parse(body);
                if(post['dbversion']<dbversion||!post['dbversion']){
                    response.writeHeader(200,{
                        "Content-Type":"text/plain"
                    });
                    response.write("failed");
                    response.end();
                    return;
                }
                if (post[GLOBAL.job]=="save") {
                    MongoClient.connect(url, function(err, db)
                    {
                        NodeJobs.save(db,post,function(payload){
                            handlePayLoad(response, payload);
                        });
                    });
                }
                else if (post[GLOBAL.job]=="load") {
                    MongoClient.connect(url, function(err, db) {
                        NodeJobs.load(db, post, function(payload)
                        {
                           handlePayLoad(response, payload); 
                        });
                    });
                    
                }
                else if(post[GLOBAL.job]=="send_message")
                {
                        MongoClient.connect(url, function(err, db) 
                        {
                            NodeJobs.sendMessage(db, post, function(payload)
                            {
                                handlePayLoad(response, payload);
                            });
                        });
                }else if(post[GLOBAL.job]=="get_message_incoming")
                {
                    MongoClient.connect(url, function(err, db) 
                    {
                        NodeJobs.getMessageIncoming(db, post, function(payload)
                        {
                            handlePayLoad(response, payload);
                        });
                    
                    });
                }
                else if(post[GLOBAL.job]=="get_message_outgoing")
                {
                    MongoClient.connect(url, function(err, db) 
                    {
                      
                        NodeJobs.getMessageOutgoing(db, post, function(payload)
                        {
                            handlePayLoad(response, payload);
                        });
                    });
                }
                else if(post[GLOBAL.job]=="save_conversation")
                {
                    
                    MongoClient.connect(url,function(err,db)
                    {
                        NodeJobs.saveConversation(db, post, function(payload)
                        {
                            handlePayLoad(response, payload);
                            
                        });
                        
                    
                    });
                }
                else if(post[GLOBAL.job]==='ChatRequest')
                {
                    MongoClient.connect(url,function(err,db)
                    {
                        NodeJobs.chatRequest(db, post, function(payload)
                        {
                            handlePayLoad(response, payload);
                        });
                    
                    });
                }
                else if(post[GLOBAL.job]==="GetChatRequests")
                {
                    MongoClient.connect(url,function(err,db)
                    {
                       NodeJobs.getChatRequests(db, post, function(payload)
                       {
                        handlePayLoad(response, payload); 
                       });
                    });
                }
                else if(post[GLOBAL.job] === "handleChatRequest")
                {
                 MongoClient.connect(url,function(err,db)
                    {
                       NodeJobs.handleChatRequest(db, post, function(payload)
                       {
                        handlePayLoad(response, payload); 
                       });
                    });
                    
                }
                else if(post[GLOBAL.job] === "cancelChatRequest")
                {
                 MongoClient.connect(url,function(err,db)
                    {
                       NodeJobs.cancelChatRequest(db, post, function(payload)
                       {
                        handlePayLoad(response, payload); 
                       });
                    });
                    
                }
                else if(post[GLOBAL.job] === "getChatResponses")
                {
                 MongoClient.connect(url,function(err,db)
                    {
                       NodeJobs.getChatResponses(db, post, function(payload)
                       {
                        handlePayLoad(response, payload); 
                       });
                    });
                    
                }
                else if(post[GLOBAL.job]==="updateMessageHasBeenSeen")
                {
                    MongoClient.connect(url,function(err,db)
                    {
                        NodeJobs.updateMessageHasBeenSeen(db,post,function(payload)
                        {
                            handlePayLoad(response,payload);
                        });
                    });
                }
                else if(post[GLOBAL.job]==="loadContactInfo")
                {
                    MongoClient.connect(url,function(err,db)
                    {
                        NodeJobs.loadContactInfo(db,post,function(payload)
                        {
                           handlePayLoad(response,payload); 
                        });
                    });
                }
                else if(post[GLOBAL.job]==="saveContactInfo")
                {
                    MongoClient.connect(url,function(err,db)
                    {
                        NodeJobs.saveContactInfo(db,post,function(payload)
                        {
                            handlePayLoad(response,payload);
                        });
                    });
                }
                else if(post[GLOBAL.job]==="send_profile")
                {
                    MongoClient.connect(url,function(err, db)
                    {
                         NodeJobs.saveProfile(db,post,function(payload)
                        {
                            handlePayLoad(response,payload);
                        });
                    });
                }
                else if(post[GLOBAL.job]==="load_profile")
                {
                      MongoClient.connect(url,function(err, db)
                    {
                         NodeJobs.loadProfile(db,post,function(payload)
                        {
                            handlePayLoad(response,payload);
                        });
                    });
                }
                else if(post[GLOBAL.job]==='get_expert_profiles')
                {
                    
                    MongoClient.connect(url,function(err, db)
                    {
                         NodeJobs.getExpertProfiles(db,post,function(payload)
                        {
                            console.log("möt");
                            console.log(payload);
                            handlePayLoad(response,payload);
                        });
                    });
                
                }
                
            });
        }
    }
    //Create a server
    var server = https.createServer(options,handleRequest);
    
    //Lets start our server
    //server.listen(PORT);
    server.listen(PORT,"0.0.0.0");
    //server.listen(PORT,$IP);
    function handlePayLoad(response, payload)
    {
        response.writeHeader(200, 
        {
            "Content-Type": "text/plain",
            //'Content-Length': 0
        });
        response.write(payload);
        response.end();
    }
//}
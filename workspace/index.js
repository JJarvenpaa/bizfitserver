"use strict";


const http = require('http');
const cluster = require('cluster');
const os = require('os');
const numCPUs = os.cpus().length
const qs = require('querystring');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const async = require('async');
const NodeJobs = require('Jobs');
const dbversion=75;




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
    
    const PORT = 8080;
    //const PORT = $PORT;
    
    
    GLOBAL.job="job";
    GLOBAL.userName="_id";
    GLOBAL.getSharedTrackers="getSharedTrackers";
    GLOBAL.sharedTrackers="SharedTrackers";
    
    
    
    
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
                    console.log(body);
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
                if (post[job]=="save") {
                    MongoClient.connect(url, function(err, db)
                    {
                        NodeJobs.save(db,post,function(payload){
                            handlePayLoad(response, payload);
                        });
                    });
                }
                else if (post[job]=="load") {
                    MongoClient.connect(url, function(err, db) {
                        NodeJobs.load(db, post, function(payload)
                        {
                           handlePayLoad(response, payload); 
                        });
                    });
                    
                }
                else if(post[job]=="send_message")
                {
                        MongoClient.connect(url, function(err, db) 
                        {
                            NodeJobs.sendMessage(db, post, function(payload)
                            {
                                console.log(payload);
                                handlePayLoad(response, payload);
                            });
                        });
                }else if(post[job]=="get_message_incoming")
                {
                    MongoClient.connect(url, function(err, db) 
                    {
                        NodeJobs.getMessageIncoming(db, post, function(payload)
                        {
                            console.log(payload);
                            handlePayLoad(response, payload);
                        });
                    
                    });
                }
                else if(post[job]=="get_message_outgoing")
                {
                    MongoClient.connect(url, function(err, db) 
                    {
                      
                        NodeJobs.getMessageOutgoing(db, post, function(payload)
                        {
                            console.log(payload);
                            handlePayLoad(response, payload);
                        });
                    });
                }
                else if(post[job]=="save_conversation")
                {
                    
                    MongoClient.connect(url,function(err,db)
                    {
                        NodeJobs.saveConversation(db, post, function(payload)
                        {
                            console.log(payload);
                            handlePayLoad(response, payload);
                            
                        });
                        
                    
                    });
                }
                else if(post[job]==='ChatRequest')
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
                        //console.log(payload);    
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
                        //console.log(payload);    
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
                        //console.log(payload);    
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
                            console.log(payload);
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
                
            });
        }
    }
    //Create a server
    var server = http.createServer(handleRequest);
    
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
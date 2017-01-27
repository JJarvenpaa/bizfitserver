"use strict";
var http = require('http');
var qs = require('querystring');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var async = require('async');

var url = 'mongodb://127.0.0.1:27017/test';

const PORT = 8080;


GLOBAL.job="job";
GLOBAL.userName="_id";
GLOBAL.getSharedTrackers="getSharedTrackers";




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

        request.on('end', function() {
            var post = JSON.parse(body);
            if (post[job]=="save") {

                // while(body.charAt(body.length-1) == '$')
                //{
                //   body = body.substr(0, body.length-1);
                //    }
                //body=body.replace(/\./g,'U+FF0E');
                //body=body.replace(/$/g,'U+FF04');

                MongoClient.connect(url, function(err, db) {
                    assert.equal(null, err);
                    db.collection('user').save(post["user"], {
                        w: 1
                    }, function(err, result) {
                        db.close();
                    });
                    response.writeHeader(200, {
                        "Content-Type": "text/plain",
                        //'Content-Length': 0
                    });
                    response.write("done");
                    response.end();
                

                });
            }
            else if (post[job]=="load") {
                MongoClient.connect(url, function(err, db) {
                    assert.equal(null, err);
                    var end = false;

                    var object;
                    var finder={};
                    finder[userName]=post[userName];
                    var cursor = db.collection('user').find(finder);
                    cursor.each(function(err, doc) {
                        assert.equal(err, null);
                        if (doc != null) {
                            if(post["checkSum"]!=doc["checkSum"]){
                                object = JSON.stringify(doc);

                            }else{
                                //object = JSON.stringify(jotain);
                            }
                            
                        }else{
                            response.writeHeader(200, {
                                "Content-Type": "text/plain",
                                //'Content-Length': object.length
                            });
                            if(typeof object != 'undefined'){
                                response.write(object);
                            }
                            
                            response.end();
                            end = true;
                            db.close();
                        }


                    });
                  
                });
                
            }else if(post[job]=="send_message"){
                    MongoClient.connect(url, function(err, db) {
                    assert.equal(null, err);
                    db.collection('message').save(post["message"], {
                        w: 1
                    }, function(err, result) {
                        var finder={};
                        finder[userName] = post['message']['resipient'];
                        var cursor = db.collection('user').find(finder);
                        cursor.each(function(err, user) 
                        {
                            assert.equal(err, null);
                            if (user != null) 
                            {
                                //conversations=user.conversations;
                                var conversationFound=false;
                                var conversations= user['conversations'];
                                for(var i=0; i < conversations.length&&!conversationFound;i++)
                                {
                                    var conversation=conversations[i];
                                    if(conversation['other'] == post['message']['sender'])
                                    {
                                        conversationFound = true;
                                        
                                    }
                                }
                                if(conversationFound===false)
                                {
                                    
                                    var conversation = {'owner': post['message']['resipient'],'other': post['message']['sender']};
                                    user['conversations'].push(conversation);
                                    db.collection('user').save(user,{
                                        w:1
                                    },function(err, result){
                                        db.close();
                                    });
                                }
                                
                            }
                            
                        });
                       
                    });
                    response.writeHeader(200, {
                        "Content-Type": "text/plain",
                        //'Content-Length': 0
                    });
                    response.write("done");
                    response.end();
                

                });
            }else if(post[job]=="get_message_incoming"){
                MongoClient.connect(url, function(err, db) {
                    console.log("prööt");
                    assert.equal(null, err);
                    var object;
                    var messageArray=[];
                    //TODO haku toistenpäin
                    //var finder={function() { return (this.resipient == post['owner'] && this.sender==post['other'] ) } };
                    //var finder={'&and':[{'resipient':{'&eq' :post['owner']}},{'sender':{'&eq' :post['other']}}]};
                    var finder={'resipient':post['owner']};
                    console.log(finder);
                    var cursor = db.collection('message').find(finder);
                    cursor.each(function(err, doc) {
                        console.log(doc);
                        assert.equal(err, null);
                        if (doc != null) {
                            //var jotain={'user':doc};
                            console.log(post["other"]);
                            console.log(doc["sender"])
                            if(post["creationTime"]<doc["creationTime"] && post["other"] == doc["sender"]){
                                messageArray.push(JSON.stringify(doc));
                            }else{
                                //array.push(JSON.stringify(doc)); // for testing only
                            }
                        }
                        else 
                        {                  
                        console.log(messageArray);
                                    var text=JSON.stringify(messageArray);
                                     response.writeHeader(200, {
                                    "Content-Type": "text/plain",
                                    //'Content-Length': text.length
                                    });
                                    response.write(text)
                                    response.end();
                                    db.close();     
                           
                       
                        }
                        

                    });
                    
                });
            }
            else if(post[job]=="get_message_outgoing"){
                MongoClient.connect(url, function(err, db) {
                    assert.equal(null, err);
                    var object;
                    var array=[];
                    //TODO haku toistenpäin
                    //var finder={function() { return (this.resipient == post['owner'] && this.sender==post['other'] ) } };
                    //var finder={'&and':[{'resipient':{'&eq' :post['owner']}},{'sender':{'&eq' :post['other']}}]};
                    var finder = {'resipient':post["other"]};
                    var cursor = db.collection('message').find(finder);
                    cursor.each(function(err, doc) {
                        assert.equal(err, null);
                        if (doc != null) {
                            //var jotain={'user':doc};
                            if(post["creationTime"]<doc["creationTime"] && post["owner"] == doc["sender"]){
                                array.push(JSON.stringify(doc));
                            }else{
                                //array.push(JSON.stringify(doc)); // for testing only
                            }
                        }
                        else 
                        {                        
                                    var text=JSON.stringify(array);
                                     response.writeHeader(200, {
                                    "Content-Type": "text/plain",
                                    //'Content-Length': text.length
                                    });
                                    response.write(text)
                                    response.end();
                                    db.close();     
                           
                       
                        }
                        

                    });
                    
                });
            }
            else if(post[job]=="save_conversation")
            {
                
                MongoClient.connect(url,function(err,db){
                    var newConversation=post['conversation'];
                    var finder={};
                    finder[userName]=newConversation['owner'];
                    var cursor=db.collection('user').find(finder);
                    var end=false;
                    cursor.each(function(err, user) {
                        assert.equal(err, null);
                        if (user != null) {
                            var conversations=user['conversations'];
                            var conversation;
                            if(conversations!=null){
                                for(var i=0;i<conversations.length;i++){
                                conversation=conversations[i];
                                if(conversation['other']==newConversation['other']){
                                    conversations[i]=newConversation;
                                    user['conversations']=conversations;
                                }
                            }

                        
                             db.collection('user').save(user, {
                                w: 1
                            }, function(err, result) {
                                db.close();
                            });

                            }
                            
                            
                            
                        }
                        else {
                            object="";
                        }
                        
                        if (!end) {
                            response.writeHeader(200, {
                                "Content-Type": "text/plain",
                                
                            });
                            response.write("heha");
                            response.end();
                            end = true;
                        }

                    });
                });
            }
             else if(post[job]=="save_tracker")
            {
                MongoClient.connect(url,function(err,db){
                    
                    var finder={};
                    finder[userName]=post[userName];
                    var newTracker = post['Tracker'];
                    var cursor=db.collection('user').find(finder);
                    cursor.each(function(err, user) 
                    {
                        assert.equal(err, null);
                        if (user != null) 
                        {
                            var trackers=user['trackers'];
                            if(trackers!=null)
                            {
                                var trackerCheck=true;
                                for(var i=0;i<trackers.length;i++)
                                {
                                    var tracker=trackers[i];
                                    if(tracker['startDate']==newTracker['startDate'])
                                    {
                                        trackers[i]=newTracker;
                                        user['trackers']=trackers;
                                        trackerCheck=false;
                                    }
                                }
                                if(trackerCheck){
                                    trackers.push(newTracker);
                                    user['trackers']=trackers;
                                }
                                 db.collection('user').save(user, 
                                 {
                                    w: 1
                                 }, function(err, result) 
                                 {

                                    db.close();
                                 });
                                
                            }
                        }
                        else 
                        {
                            object="";
                        }
                        if (!end) 
                        {
                            response.writeHeader(200, 
                            {
                                "Content-Type": "text/plain",
                                //'Content-Length': object.length
                            });
                            response.write(object);
                            response.end();
                            end = true;
                        }

                    });
                });
            }
             else if(post[job]==getSharedTrackers)
            {
                //lisää async
                var jokuLista=[];
                MongoClient.connect(url,function(err,db)
                {
                    var list=post["list"];
                    async.each(list,function(name,callback){
                        var sharedTracker=name;
                        var finder={};
                        finder[userName]=name[userName];
                        if(typeof finder[userName] != 'undefined'){

                            var cursor=db.collection('user').find(finder);
                            cursor.nextObject(function fn(err, user) {
                                if (err || !user){
                                    callback();
                                    return;
                                } 
                            
                                setImmediate(fnAction, user, function() {
                                    cursor.nextObject(fn);
                                    
                                });
                            });
                            
  
                            
                            function fnAction(user, callback) {
                                // Here you can do whatever you want to do with your item.
                                if(typeof user!= 'undefined'&& user!=null && user['trackers']!= 'undefined'){
                                    var trackers=user['trackers'];
                                    if(trackers!=null)
                                    {
                                        for(var j=0;j<trackers.length;j++)
                                        {
                                            var tracker=trackers[j];
                                            if(tracker['creationTime']==sharedTracker['creationTime'])
                                            {
                                                jokuLista.push(JSON.stringify(tracker));
                                            }
                                        }
                                    }
                                }
                                return callback();
                            }
                            
                            
                           
                        }
                        
                    },function(err){
                        if(err){
                            response.writeHeader(200, 
                            {
                                "Content-Type": "text/plain",
                                //'Content-Length': object.length
                            });
                            response.write("failed");
                            //db.close();
                            return err;
                        }
                        response.writeHeader(200, 
                        {
                            "Content-Type": "text/plain",
                            //'Content-Length': object.length
                        });
                       
                        response.write(JSON.stringify(jokuLista))
                        db.close();
                        response.end();
                    });
                  
                });
            }
            
        });
    }
}

//Create a server
var server = http.createServer(handleRequest);

//Lets start our server
server.listen(PORT,"0.0.0.0");

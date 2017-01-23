var http = require('http');
var qs = require('querystring');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

var url = 'mongodb://127.0.0.1:27017/test';

const PORT = 8080;


var job="job";
var userName="userName";
var getSharedTrackers="getSharedTrackers";




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
                    var finder={'_id':post['_id']};
                    var cursor = db.collection('user').find(finder);
                    cursor.each(function(err, doc) {
                        assert.equal(err, null);
                        if (doc != null) {
                            var jotain={'user':doc};
                            if(post["checkSum"]!=doc["checkSum"]){
                                object = JSON.stringify(jotain);

                            }else{
                                //object = JSON.stringify(jotain);
                            }
                            
                        }
                        else {
                            object="";
                        }
                        if (!end) {
                            response.writeHeader(200, {
                                "Content-Type": "text/plain",
                                //'Content-Length': object.length
                            });
                            response.write(object);
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
                        db.close();
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
                    assert.equal(null, err);
                    var object;
                    var array=[];
                    //TODO haku toistenpäin
                    //var finder={function() { return (this.resipient == post['owner'] && this.sender==post['other'] ) } };
                    //var finder={'&and':[{'resipient':{'&eq' :post['owner']}},{'sender':{'&eq' :post['other']}}]};
                    var finder={'resipient':post['owner']};
                    var cursor = db.collection('message').find(finder);
                    cursor.each(function(err, doc) {
                        assert.equal(err, null);
                        if (doc != null) {
                            //var jotain={'user':doc};
                            if(post["creationTime"]<doc["creationTime"] && post["other"] == doc["sender"]){
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
                                    end = true;
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
                                    end = true;
                                    db.close();     
                           
                       
                        }
                        

                    });
                    
                });
            }
            else if(post[job]=="save_conversation")
            {
                
                MongoClient.connect(url,function(err,db){
                    var newConversation=post['conversation'];
                    var finder={'_id':newConversation['owner']};
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
                    
                    var finder={'_id':post[userName]};
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
                var jokuLista=[];
                MongoClient.connect(url,function(err,db)
                {
                    var list=post["list"];
                    for(var i=0;i<list.length;i++)
                    {
                        var sharedTracker=list[i];
                        var finder={'_id':post[userName]};
                        var cursor=db.collection('user').find(finder);
                        cursor.each(function(err, user) 
                        {
                            var trackers=user['trackers'];
                            if(trackers!=null)
                            {
                                for(var j=0;j<trackers.length;j++)
                                {
                                    var tracker=trackers[i];
                                    if(tracker['creationTime']==sharedTracker['creationTime'])
                                    {
                                        jokuLista.push(JSON.stringify(tracker));
                                    }
                                }
                            }
                        });
                    }
                    response.writeHeader(200, 
                        {
                            "Content-Type": "text/plain",
                            //'Content-Length': object.length
                        });
                    response.write(JSON.stringify(jokuLista));
                    db.close();
                    response.end();
                   
                });
            }
            
        });
    }
}

//Create a server
var server = http.createServer(handleRequest);

//Lets start our server
server.listen(PORT,"0.0.0.0");

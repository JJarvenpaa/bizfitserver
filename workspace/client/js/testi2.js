// JavaScript File
var http=require("http")
    var post_options = {
      host: 'https://ide.c9.io/kaupunkiapina/bizfit',
      port: '8080',
      method: 'POST',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
      }
  };
var post_req = http.request(post_options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
          console.log('Response: ' + chunk);
      });
  });
   
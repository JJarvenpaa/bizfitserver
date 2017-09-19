var Gmail = require('gmail-imap');
const express = require('express');
var app = express();
var cfg = {
    CLIENT_ID: '51484748084-bulj3s69f03aumiqem895fribuhtjqo2.apps.googleusercontent.com',
    CLIENT_SECRET: 'bss3OL6lCJbS5RP6eR8ltaj1'
};
  app.get( function(req, res){
    res.send('hello world');
    var gmail = new Gmail(cfg);

    // Get gmail's authentication URL
    var authUrl = gmail.getAuthUrl();
    console.log(authUrl);
    // redirect user to authUrl
    res.redirect(authUrl);
    
    gmail.getAccessToken(code, function(callback) {
      if(callback.access_token) {
        gmail.getEmail(callback.access_token, function(data) {
            console.log(data.emails[0].value);
          ///res.send(data.emails[0].value);
        });
      }
    });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');

})



// Simple HTTP Server example, keeps track of the number of requests
// for each user and reports back over HTTP
var http = require('http');
var url = require('url');
var mp = require('@metaparticle/storage');

mp.setStorage('file');

var server = http.createServer((request, response) => {
    var urlObj = url.parse(request.url, true);
    var scopeName = urlObj.query.user;
    if (!scopeName) {
        scopeName = 'anonymous'
    }
    mp.scoped(scopeName, (scope) => {
        if (!scope.count) {
            scope.count = 0;
        }
        scope.count++;
        return scope.count;
    }).then((count) => {
        response.end("There have been " + count + (count == 1 ? ' request.' :  ' requests.'));
    });
});

server.listen(8090, (err) => {  
  if (err) {
    console.log('error starting server', err)
  }

  console.log(`server is listening on http://localhost:8090`)
});
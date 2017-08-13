// Simple HTTP Server example, keeps track of the number of requests
// and reports back over HTTP
var http = require('http');
var mp = require('@metaparticle/storage');

mp.setStorage('file');

var server = http.createServer((request, response) => {
    mp.scoped('global', (scope) => {
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
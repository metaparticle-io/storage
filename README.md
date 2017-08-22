# Metaparticle/storage
Easy implicit, concurrent persistence for [Node.js](https://nodejs.org)

Metaparticle/storage makes distributed storage easy.

## Implicit, automatic persistence
With Metaparticle/storage you can interact with local variables in a defined _scope_. Any changes
that you make are automatically persisted, _even if your server crashes or restarts_.

## Cloud native, built for distributed systems.
Metaparticle/storage is defined for distributed systems running on multiple machines. In particular
Metaparticle/storage ensures [read/update/write consistency](https://en.wikipedia.org/wiki/Read-modify-write).
If Metaparticle/storage detects a conflict due to multiple concurrent writers it automatically rolls back
modifications and re-applies the complete function.

## How does it work?
Metaparticle/storage works by defining a collection of _scopes_. Each scope is a named value which can be
obtained by a call to `metaparticle.scoped(scopeName, handlerFunction)`. _scopeName_ provides a unique name
for this scoped data. The data itself is passed on to the handlerFunction. Any modifications to the _scope_
are automatically detected and persisted.

## Example
Here is a simple web-server which increments a counter and returns the number of requests. Despite looking
like a local variable, the counter is kept globably, and persists despite server restarts, scaling or failures.
Furthermore, the read/update/write of the counter is automatically atomic, even under concurrent load the
system maintains the correct count of requests.

```js
...
var mp = require('@metaparticle/storage');
mp.setStorage('file');

var server = http.createServer((request, response) => {
    // Define a scope for storage, in this case it is a shared 'global' scope.
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
```

## Selecting different storage backends
Metaparticle/storage supports several different storage backends. To select a particular storage
implementation, you need to select it with the `setStorage(driver, config)` function.

Currently Metaparticle supports the following drivers:
   * `file`: Filesystem-local, useful for testing, not much else.
   * `redis`: The Redis key/value store
   * `mysql`: Everone's favorite relational database.

## Defining multiple scopes
The total throughput of an application is related to the total number of concurrent requersts for a particular
scope. Often it makes sense to partition scopes based on user name, location or other variables. Here is a simple
script that partitions the scope by user-name:

```js
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
```

## Caveats
There's no free lunch. To ensure atmocity, Metaparticle/storage may run your code more than once. Though the data input to the function is reset each time, any other side-effects can not be rolled back.

This means that you _must not_ have side-effects in your code.

Examples of side-effects include:
   * Returning data over an HTTP channel
   * Writing to a file
   * Writing to a non-scoped variable

Metaparticle/storage does not currently detect these side-effects. This means that it is up to you to police your usage and ensure that the code within a scope is side-effect free.

## Deep Dive
There is a much deeper dive [here](details.md), it contains a deeper description of the problems Metaparticle/storage is trying to solve and examples of it in operation.

## Bugs
There are probably some

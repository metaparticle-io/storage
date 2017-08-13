var mp = require('@metaparticle/storage');

mp.setStorage('file', { directory: '/tmp' });
mp.scoped('global', function(scope) {
    if (!scope.calls) {
        scope.calls = 0;
    }
    scope.calls++;
    return scope.calls;
}).then(function(calls) {
    console.log(calls);
    mp.shutdown();
});

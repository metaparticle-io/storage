(function () {
    var storage = null;
    var q = require('q');
    var storageImpls = {
        "file": require('./metaparticle-file-storage.js'),
        "redis": require('./metaparticle-redis-storage'),
        "mysql": require('./metaparticle-mysql-storage.js')
    }

    module.exports.setStorage = function(name, config) {
        storage = storageImpls[name];
        if (storage != null) {
            storage.configure(config);
        }
    }

    module.exports.shutdown = () => {
        if (storage && storage.shutdown) {
            storage.shutdown();
        }
    }

    module.exports.scoped = function(name, fn) {
        if (storage == null) {
            throw("You must initialize a storage implementation via setStorage first.");
        }
        var promise = q.defer();
        loadExecuteStore(name, fn, promise);
        return promise.promise;
    }

    var loadExecuteStore = function(name, fn, promise) {
        storage.load(name).then(function(data) {
            var dirty = false;
            var Proxy = require('harmony-proxy');
            var obj = new Proxy(data.data, {
                set: function (target, property, value) {
                    data.data[property] = value;
                    dirty = true;
                    return true;
                }
            });
            var result = fn(obj);
            if (dirty) {
                storage.store(name, data).then(function(success) {
                    if (!success) {
                        setTimeout(function() {
                            loadExecuteStore(name, fn, promise);
                        }, 100);
                    } else {
                        promise.resolve(result);
                    }
                }).catch(function(error) {
                    console.log(error);
                });
            }
        }).catch(function(error) {
            console.log(error);
        });
    };
}());
var mysql = require('mysql');
var q = require('q');

var connection = null;

module.exports.configure = function (config) {
    if (config) {
        connection = mysql.createConnection(config);
    } else {
        connection = mysql.createConnection({
            host     : 'localhost',
            user     : 'root',
            database : 'data'
        });
    }
      
    connection.connect();

    connection.query('create table if not exists records (name varchar(256) primary key, version int, data text);', (error) => {
        if (error) {
            throw error;
        }
    });
};


module.exports.load = function (scope) {
    var deferred = q.defer();
    connection.query('select version, data from records where name=\'' + scope + '\'', (error, results) => {
        if (error) {
            throw error;
        }
        if (results.length == 0) {
            deferred.resolve({
                'data': {},
                'version': 'empty'
            });
            return;
        }
        var obj = JSON.parse(results[0].data);
        obj.version = results[0].version;
        deferred.resolve(obj);
    });
    return deferred.promise;
}

/**
 * Store the data to persistent storage.
 * @param {string} scope The scope to store
 * @param {data} data The data package
 * @returns A promise that resolves to true if the storage succeeded, false otherwise.
 */
module.exports.store = function (scope, data) {
    var deferred = q.defer();
    if (data.version == 'empty') {
        var sql = mysql.format('insert into records (name, version, data) values (?, ?, ?);', [scope, 1, JSON.stringify(data)]);
        connection.query(sql, (error) => {
            if (error) {
                if (error.code == 'ER_DUP_ENTRY') {
                    deferred.resolve(false);
                    return;
                }
                throw(error);
            }
            deferred.resolve(true);
        });
    } else {
        var oldVersion = data.version;
        data.version++;
        var sql = mysql.format('update records set data=?, version=? where (name=? and version=?) ', [JSON.stringify(data), data.version, scope, oldVersion]);
        connection.query(sql, (error, results) => {
            if (error) {
                throw(error);
            }
            if (results.affectedRows != 1) {
                deferred.resolve(false);
                return;
            }
            deferred.resolve(true);
        })
    }
    return deferred.promise;
};

module.exports.shutdown = () => {
    connection.end();
}
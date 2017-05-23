var settings = require("./settings"),
    sql = require("mssql");

module.exports.query = function(sqlStr, params, callback) {
    "use strict";

    var conn = new sql.ConnectionPool(settings.database, function(err) {
        var ps;

        if (err) {
            callback(err);
            return;
        }

        ps = new sql.PreparedStatement(conn);
        Object.keys(params).forEach(function(key) {
            ps.input(key, params[key].type);
        });
        ps.multiple = true;
        ps.prepare(sqlStr, function(err) {
            var paramList = {},
                paramMap;

            if (err) {
                callback(err);
                return;
            }

            paramMap = Object.keys(params).map(function(key) {
                return [key, params[key].value];
            });

            for (let i = 0, length = Object.keys(paramMap).length; i < length; i++) {
                paramList[paramMap[i][0]] = paramMap[i][1];
            }

            ps.execute(
                paramList, function(err, data) {
                    if (err) {
                        callback(err);
                        return;
                    }

                    ps.unprepare(function(err) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        callback(null, data);
                    });
                }
            );
        });
    });
};

module.exports.TYPES = sql.TYPES;

Object.keys(sql.TYPES).forEach(function(key) {
    "use strict";

    var value = sql.TYPES[key];

    module.exports[key] = value;
    module.exports[key.toUpperCase()] = value;
});

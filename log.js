class Log {
    log(obj) {
        console.log(obj);
    }

    exception(message, err) {
        console.log(message);
        console.log(err);
    }
}

module.exports = Log;

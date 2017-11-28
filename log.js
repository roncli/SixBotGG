class Log {
    static log(obj) {
        console.log(obj);
    }

    static exception(message, err) {
        console.log(message);
        console.log(err);
    }
}

module.exports = Log;

const Db = require("./database"),
    Discord = require("./discord"),
    Log = require("./log"),
    Tmi = require("./tmi");

//         #                 #
//         #                 #
//  ###   ###    ###  ###   ###   #  #  ###
// ##      #    #  #  #  #   #    #  #  #  #
//   ##    #    # ##  #      #    #  #  #  #
// ###      ##   # #  #       ##   ###  ###
//                                      #
/**
 * Starts up the application.
 */
(function startup() {
    Log.log("Starting up...");

    // Get streamers and hosted channels.
    Db.query("select streamer from streamer; select streamer from host").then((data) => {
        Log.log("Got streamer data.");

        // Startup tmi
        Tmi.startup();
        Tmi.connect();

        // Startup Discord
        Discord.startup();
        Discord.connect();

        // Add streamers and hosts.
        data.recordsets[0].forEach((streamer) => Discord.addStreamer(streamer.streamer));
        data.recordsets[1].forEach((streamer) => Discord.addHost(streamer.streamer));
    }).catch((err) => {
        setTimeout(startup, 60000);
        Log.exception("There was a database error getting streamers and hosted channels.", err);
    });
}());

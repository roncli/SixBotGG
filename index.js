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
    Db.getStreamersAndHosts().then((data) => {
        Log.log("Got streamer data.");

        // Startup tmi
        Tmi.startup();
        Tmi.connect();

        // Startup Discord
        Discord.startup();
        Discord.connect();

        // Add streamers and hosts.
        data.streamers.forEach((streamer) => Discord.addStreamer(streamer));
        data.hosts.forEach((host) => Discord.addHost(host));
    }).catch((err) => {
        setTimeout(startup, 60000);
        Log.exception("There was a database error getting streamers and hosted channels.", err);
    });
}());

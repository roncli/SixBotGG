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
(async function startup() {
    Log.log("Starting up...");

    // Set the window title.
    if (process.platform === "win32") {
        process.title = "SixBotGG";
    } else {
        process.stdout.write("\x1b]2;SixBotGG\x1b\x5c");
    }

    // Get streamers and hosted channels.
    let data;
    try {
        data = await Db.getStreamersAndHosts();
    } catch (err) {
        setTimeout(startup, 60000);
        Log.exception("There was a database error getting streamers and hosted channels.  Retrying in 60 seconds...", err);
        return;
    }

    Log.log("Got streamer data.");

    // Startup tmi
    Tmi.startup();
    await Tmi.connect();

    // Startup Discord
    Discord.startup();
    await Discord.connect();

    // Add streamers and hosts.
    data.streamers.forEach((streamer) => Discord.addStreamer(streamer));
    data.hosts.forEach((host) => Discord.addHost(host));
}());

process.on("unhandledRejection", (err) => {
    Log.exception("Unhandled promise rejection caught.", err);
});

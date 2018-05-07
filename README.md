SixBotGG
========

This is the source repository for the [Six Gaming Twitch Channel](http://twitch.tv/sixgaminggg) and [Six Gaming Discord Server](http://ronc.li/six-discord) chat bot known as [SixBotGG](http://twitch.tv/sixbotgg).  This bot is written in [node.js](http://nodejs.org).

Installation
============

1. Install the node modules from the base directory (ignore errors and warnings on Windows):

        npm install
 
2. Create the settings.js file in the root directory as indicated below.
3. Run the following command from the base directory:

        node index.js

Database
========

The database is quite simple.  Here is the script that creates it:

        CREATE TABLE game (
            id int IDENTITY(1,1) NOT NULL,
            game varchar(255) NOT NULL,
            code varchar(50) NOT NULL
        )
        
        CREATE TABLE host (
            id int IDENTITY(1,1) NOT NULL,
            streamer varchar(50) NOT NULL
        )
        
        CREATE TABLE streamer(
            id int IDENTITY(1,1) NOT NULL,
            discord varchar(50) NOT NULL,
            streamer varchar(50) NOT NULL
        )

settings.js
===========

The following should be the contents of settings.js:

        module.exports = {
            irc: {
                server: "irc.twitch.tv",
                nick: "(The nickname of the bot you wish to log in as)",
                options: {
                    userName: "(The nickname of the bot, properly capitalized)",
                    realName: "(A long name for the bot)",
                    port: 6667,
                    password: "(The oauth key to log into, retrieved from Twitch)",
                    autoConnect: false
                }
            },
            discord: {
                token: "(Your token, retrieved from your Discord bot account)",
                options: {
                    autoReconnect: true
                }
            },
            twitch: {
                clientId: "(Your client ID, retrieved from your Twitch connected app)",
                clientSecret: "(Your client secret, retrieved from your Twitch connected app)",
                redirectUri: "(Your redirect URI from your Twitch connected app)",
                scopes: []
            },
            database: {
                server: "(Your SQL server's IP)",
                port: (Your SQL server's port number),
                user: "(Your SQL server's user account name)",
                password: "(Your SQL server's password)",
                database: "(Your SQL server's database)",
                pool: {
                    max: 50,
                    min: 0,
                    idleTimeoutMillis: 30000
                }
            },
            admin: {
                username: "(Your Discord account name)",
                discriminator: (Your Discord account discriminator, not including the pound sign)
            }
        };

Coming Soon
===========
1.4.2
-----
* Upgrade to new Twitch library that uses the new Helix API.
* Nothing to see here. 😴

1.4.1
-----
* Discord.js update to get channels inside categories working as expected.
* Added Brigitte to randomonium.
* Remove streamers that are no longer on the Discord server.
* Use database library for improved error handling.
* Get out. 👉

Version History
===============
1.4 - 12/25/2017
----------------
* Implement advanced logging which outputs bot activity to #bot-activity, and error activity to #bot-errors.
* Implement channel categories, with one each for bot channels, general channels, streamer channels, and voice channels.
* Enhance bot output using Discord Rich Embeds, with text-only fallbacks.
* Eliminate `!addtwitch`, `!removetwitch`, and `!confirm` commands, and just automatically determine if the user is a Six Gaming streamer using statuses on Discord.
* Damn, I'm pretty. 😍

1.3.1 - 11/27/2017
------------------
* Code refactored for readability.
* * Main module now only handles initial connect and startup calls.
* * Separate modules for database, Discord API, Twitch API, and Tmi connectivity.
* * Preparing for advanced logging by breaking out logging into its own module and adding an exception module to throw errors along with where they occurred.
* * Randomonium is now in its own module.
* * * Added Doomfist and Moira to randomonium.
* * Commands are now in their own module, and are used by instanciating the Commands class with whether the commands will be coming from Discord or Tmi.  Security on these commands are now done per command, which allows for commands to be shared between different services.
* Big update.  Zero new features. 💯


1.3 - 5/22/2017
---------------
* Bot no longer pings @everyone when a streamer goes live.  Instead, you must `!streamnotify` to be alerted to when a streamer goes live, and `!streamunnotify` to turn it off.
* Bot no longer creates #game-* channels for every game that is created.
* Bot no longer creates #twitch-* text channels for every Twitch streamer who registers.  Instead, you must `!addmychannel` to create your text channel, and `!removemychannel` to remove it.
* It sucks less. 👌

1.2.1 - 3/25/2017
-----------------
* Added Sombra and Orisa to `!randomonium`.

1.2 - 12/24/2016
----------------
* Replaced IRC library with tmi.js for smoother IRC operation.
* Fix various issues with the discord.js upgrade.

1.1.5 - 9/20/2016
-----------------
* Fixed issues with discord.js upgrade.
* Fixed a bug where the IRC bot would get stuck talking about the website.

1.1.4 - 8/18/2016
-----------------
* Fixed voice channel issues.

1.1.3 - 7/23/2016
-----------------
* Added Ana to `!randomonium`.
* Fixed diacritics for `!randomonium`.

1.1.2 - 7/9/2016
----------------

* Fixed a bug with Six Gaming going live on Twitch.
* Fixed a bug with the `!randomonium` command.

1.1.1 - 6/29/2016
-----------------

* Adds the `!randomonium` command.

1.1 - 6/19/2016
---------------

This major release includes database connectivity and a Discord bot.

* Allow Twitch hosting commands from Discord.
* Allow users to register as Twitch streamers on Discord with Twitch confirmation.  This replaces the old hosting rotation system that had Twitch users manually entered. 
* Created a secondary hosting rotation that users with the Podcasters role can freely add or remove from.  Streamers in the primary rotation are always given priority over this secondary rotation.
* Allow Discord users to create voice channels that auto-delete after being empty for 5 minutes.
* Added a system that creates Discord roles for games that can be subscribed to for notification. 

1.0.1 - 3/7/2016
----------------

This is a bug fix release.

* Do not greet SixBotGG or SixGamingGG in chat.
* Do not assume people have been unmodded, and do not greet if they were already modding.
* Check if `response` is an object before trying to check the `stream` object. 

1.0.0 - 3/2/2016
----------------

This is the initial release of the SixBotGG chat bot.

* Auto logs into Twitch and enters the #sixgaminggg chat
* Recognizes the !facebook, !twitter, !youtube, and !itunes commands from all users.
* Auto-cycles through the above four commands when both 10 minutes and 5 chat messages have occurred.
* Recognizes the !host <user> and !unhost commands from moderators.
* Automatically cycles every 10 minutes through hosting a select list of streamers when SixGamingGG is offline.
* Hosts someone else when the currently hosted client's stream ends.
* Stops hosting when manually hosting another streamer, or SixGamingGG starts streaming.

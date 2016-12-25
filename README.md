SixBotGG
========

This is the source repository for the [Six Gaming Twitch Channel](http://twitch.tv/sixgaminggg) chat bot known as [SixBotGG](http://twitch.tv/sixbotgg).  This bot is written in [node.js](http://nodejs.org).

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
            streamer varchar(50) NOT NULL,
            code int NOT NULL,
            validated bit NOT NULL CONSTRAINT DF_streamer_validated DEFAULT (0)
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

Version History
===============

1.2
---
* Replaced IRC library with tmi.js for smoother IRC operation.

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

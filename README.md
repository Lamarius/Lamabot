# Lamabot
A discord bot designed for playing games with other users.

## Prerequisites

Lamabot is not hosted publicly, therefore in order to use it you'll need to host it yourself. Lamabot requires the following to run:

```
Node.js
Mongodb
```

## Installing

You must first create an application on [discord's application page](https://discordapp.com/developers/applications/me). You can give your application any name and icon that you desire. Make sure you hit the `Create a Bot User` button to turn your application into a bot.

## Running the bot

The bot uses two environment variables:

```
LAMABOT_TOKEN: The bot's token, which can be found on discord's application page
MONGO_URL: The url to the mongo database. This variable has a default value of 'mongodb://localhost:27017/lamabot'
```

You must set the ``LAMABOT_TOKEN`` variable when you launch your bot. If your database is not on the localhost, or your bot's db user is not ``lamabot``, you must specify the ``MONGO_URL`` variable as well.

```
$ LAMABOT_TOKEN=YOUR_BOT_TOKEN MONGO_URL=mongodb://dbuser:dbuserspassword@someserver:27017/dbname node lamabot
```

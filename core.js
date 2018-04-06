// Core functions shared between multiple classes
const Discord = require('discord.js');
const bot = new Discord.Client();

module.exports = {
  mention: function (user) {
    if (user && user.id) {
      return "<@" + user.id + ">";
    }
    return "<@" + user + ">";
  },
  bot: bot
};
// Core functions shared between multiple classes

module.exports = {
  mention: function (user) {
    if (user && user.id) {
      return "<@" + user.id + ">";
    }
    return "<@" + user + ">";
  }
}

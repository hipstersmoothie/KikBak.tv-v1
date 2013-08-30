/////////////////// Browse Rooms ///////////////////
var roomsHandle = Meteor.subscribe('rooms');

Template.BrowseRooms.loading = function () {
  return !roomsHandle.ready();
};

Template.BrowseRooms.rooms = function () {
  return Rooms.find({isPrivate:false});
};
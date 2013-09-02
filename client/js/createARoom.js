/////////////////// Create Room ///////////////////

Template.CreateARoom.events({
  'click .save' : function () {
    var newRoomName = $('#name').val();
    var makePrivate = $('#isPrivate').is(':checked');
    Meteor.call("create_room", newRoomName, makePrivate, function(error,room_id) {
      Session.set("room_id", room_id);
      Meteor.call("create_videos", Session.get('room_id'), function(error,videos_id) {
        Session.set("videos_id", videos_id);
        Meteor.Router.to('/rooms/' + Session.get('room_id')  + '/addVideo');
      });
    });
  }
});
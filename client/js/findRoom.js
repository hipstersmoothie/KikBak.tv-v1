/////////////////// Find Room ///////////////////
Template.FindRoom.events({
  'click .goToRoom' : function () {
    var room_id = $('#privateId').val();
    if(Rooms.findOne({urlId: room_id}))
      Meteor.Router.to('/rooms/' + room_id + '/mode');
    else 
      $('#error').show();
  }
});
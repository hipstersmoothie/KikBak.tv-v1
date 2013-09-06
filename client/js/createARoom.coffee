Template.CreateARoom.events
  'click .save' : ->
    newRoomName = $('#name').val()
    makePrivate = $('#isPrivate').is(':checked')
    Meteor.call "create_room", newRoomName, makePrivate, (error,room_id) ->
      Session.set "room_id", room_id
      Meteor.call "create_videos", Session.get('room_id'), (error,videos_id) ->
        Session.set "videos_id", videos_id 
        Meteor.Router.to '/rooms/' + Session.get('room_id')  + '/addVideo'
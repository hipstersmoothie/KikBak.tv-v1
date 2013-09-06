roomsHandle = Meteor.subscribe 'rooms'

Template.BrowseRooms.loading = ->
  Session.set 'color', false 
  !roomsHandle.ready()

Template.BrowseRooms.rooms = ->
  Rooms.find
    isPrivate:false
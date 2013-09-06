Template.ChooseModeScreen.events
  'click .theater' : -> Session.set 'mode', 'theater'
  'click .submitter' : -> Session.set 'mode', 'submitter'

Template.ChooseModeScreen.room = ->
  Rooms.findOne
    urlId: Session.get 'room_id'
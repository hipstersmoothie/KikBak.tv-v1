/////////////////// Choose Mode ///////////////////

Template.ChooseModeScreen.events({
  'click .theater' : function() {
    Session.set('mode', 'theater');
  },
  'click .submitter' : function() {
    Session.set('mode', 'submitter');
  }
});

Template.ChooseModeScreen.room = function () {
  return Rooms.findOne({urlId: Session.get('room_id')});
};
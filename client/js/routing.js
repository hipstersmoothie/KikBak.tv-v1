/////////////////// Routing ///////////////////

var setState = function(state) {
  var date = new Date();
  localStorage.setItem('state', state);
  localStorage.setItem('stateTime', date.getTime());
}

Meteor.Router.add({
  '/rooms/new/add': function() {
    setState('/rooms/new/add');
    return 'CreateARoom';
  },
  '/rooms/find': function() {
    setState('/rooms/find');
    return 'FindRoom';
  },
  '/rooms/:id/addVideo' : function(id) {
    setState('/rooms/' + id + '/addVideo');
    Session.set("room_id", id);
    if(Session.get("room_id"))
      return 'AddVideoScreen';
  },
  '/rooms/:id/mode' : function(id) {
    setState('/rooms/' + id + '/mode');
    Session.set("room_id", id);
    if(Session.get("room_id"))
      return 'ChooseModeScreen';
  },
  '/rooms/:id' : function(id) {
    setState('/rooms/' + id);
    Session.set("room_id", id);
    Session.set('playing', false);
    if(Session.get("room_id"))
      return 'EnteredRoom';
  },
  '/rooms' : function() {
    setState('/rooms');
    Session.set('room_id', null);
    Session.set('videos', null);
    Session.set('videos_id', null);
    Session.set('playing', false);
    return 'BrowseRooms';
  },
  '/about' : 'about',
  '/loadingPage' :'loadingPage',
  '/': function() {
    var currDate = new Date();
    var iOS = ( navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false );
    if(localStorage.getItem('stateTime') && currDate.getTime() - localStorage.getItem('stateTime')<= 3600000 && iOS)
      Meteor.Router.to(localStorage.getItem('state'));
    return 'Home';
  },
  '/contact': 'Contact'
});
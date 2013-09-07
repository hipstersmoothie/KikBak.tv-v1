Rooms = new Meteor.Collection("rooms");
Videos = new Meteor.Collection("videosQue");

Meteor.startup(function () {
  Session.set('room_id', null);
  Session.set('videos', null);
  Session.set('videos_id', null);
  Session.set('playing', false);
  // switch between adding view and playlist
  Session.set('adding', false);
  // addvideopage switch add method
  Session.set('linkGrabber', false);
});
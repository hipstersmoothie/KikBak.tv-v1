Rooms = new Meteor.Collection("rooms");
Videos = new Meteor.Collection("videosQue");

if (Meteor.isServer) {
  Meteor.startup(function () {
    Rooms.remove({});
  });

  // Rooms -- { name: String,
  //            room_id: String
  //            isPrivate: boolean
  //                  }
  Meteor.publish('rooms', function () {
    return Rooms.find();
  });

  // Videos - {videoIds: [String, ..,],
  //           totalVideos: Number,
  //           room_id: String,
  //           currentVideoId: Number}
  Meteor.publish('videosQue', function (room_id) {
    return Videos.find({room_id: room_id});
  });


  Meteor.methods({
    create_room: function(roomName, private1) {
      console.log("CREATING ROOM");
      var room_id = Rooms.insert({name: roomName, 
                                  isPrivate: private1, 
                                  modified_on: new Date().getTime()});
      return room_id;
    },
    create_videos: function(room_id) {
      console.log("CREATING VIDEOS FOR ROOM");
      var videos_id = Videos.insert({videos: [],
                     videoIds: [],
                     totalVideos: 0,
                     currentVideoId: null,
                     room_id: room_id});
      return videos_id;
    }
  });
}

if (Meteor.isClient) {
  var AmplifiedSession = _.extend({}, Session, {
    keys: _.object(_.map(amplify.store(), function (value, key) {
      return [key, JSON.stringify(value)];
    })),
    set: function (key, value) {
      Session.set.apply(this, arguments);
      amplify.store(key, value);
    }
  });

  Meteor.startup(function () {
    AmplifiedSession.set('room_id', null);
    AmplifiedSession.set('videos', null);
    AmplifiedSession.set('videos_id', null);
    AmplifiedSession.set('playing', false);
  });

  var roomsHandle = Meteor.subscribe('rooms');
  var videosHandle = null;

  Deps.autorun(function(){
    var room_id = AmplifiedSession.get('room_id');
    if (room_id)
      videosHandle = Meteor.subscribe('videosQue', room_id);
    else
      videosHandle = null;
  });

  /////////////////// Routing ///////////////////

  Meteor.Router.add({
    '/rooms/new/add': 'CreateARoom',
    '/rooms/find':'FindRoom',
    '/rooms/:id/addVideo' : 'AddVideoScreen',
    '/rooms/:id' : function(id) {
      AmplifiedSession.set("room_id", id);
      AmplifiedSession.set('playing', false);
      console.log(AmplifiedSession.get('room_id'));
      return 'EnteredRoom';
    },
    '/rooms' : function() {
      AmplifiedSession.set('room_id', null);
      AmplifiedSession.set('videos', null);
      AmplifiedSession.set('videos_id', null);
      AmplifiedSession.set('playing', false);
      return 'BrowseRooms';
    },
    '/about' : 'about',
    '/loadingPage' :'loadingPage',
    '/': 'Home'
  });

  /////////////////// Browse Rooms ///////////////////

  Template.BrowseRooms.loading = function () {
    $('#big').css({"max-width":"100%"});
    return !roomsHandle.ready();
  };

  Template.BrowseRooms.rooms = function () {
    return Rooms.find({isPrivate:false});
  };

  /////////////////// Entered Room ///////////////////
  Template.EnteredRoom.loading = function () {
    return videosHandle && !videosHandle.ready();
  };

  Template.EnteredRoom.room = function () {
    return Rooms.findOne(AmplifiedSession.get('room_id'));
  };

  Template.EnteredRoom.video_objs = function () {
    return Videos.findOne({room_id: AmplifiedSession.get('room_id')}).videoIds.length;
  };

  Template.EnteredRoom.rendered = function () {
    if(!AmplifiedSession.get('playing') && AmplifiedSession.get('videos') && AmplifiedSession.get('videos').videoIds.length) {
      AmplifiedSession.set('playing', true);
      var currVid = 0, playlist = AmplifiedSession.get('videos').videoIds;
      renderVid(playlist, currVid);
    }
  };

  Template.EnteredRoom.videoData = function() {
    var videoData = {}, ids = "";

    AmplifiedSession.set('videos', Videos.findOne({room_id: AmplifiedSession.get('room_id')}));
    for(var i = 0; i < AmplifiedSession.get('videos').videoIds.length; i++) {
      if (AmplifiedSession.get('videos').videoIds[i]) {
        ids += AmplifiedSession.get('videos').videoIds[i]
        if (i < AmplifiedSession.get('videos').videoIds.length - 1)
          ids += ',';
      }
    }

    gapi.client.setApiKey("AIzaSyCnGXLE1spj9r30DJAkXCXcrAVCBXV73xM");
    gapi.client.load('youtube', 'v3', function() { 
      var request = gapi.client.youtube.videos.list({part:'snippet', id: ids});
      request.execute(function(response) {
        return response.items;
      });
    });
  };

  var renderVid = function(playlist, currVid) {
    var video = Popcorn.youtube('#youtube-video', 'http://www.youtube.com/embed/' + playlist[currVid] + '&autoplay=1');

    video.on("ended", function() {
      playlist = AmplifiedSession.get('videos').videoIds;
      if (++currVid < playlist.length) {
        AmplifiedSession.set('currentVideo', playlist[currVid]);
        renderVid(playlist, currVid);
      }
      else {
        $('#youtube-video').hide();
        $('#video-container').append('<div style="font-size:30px;color:white;">No Videos :( Try adding one!</div>');
      }
    });
  }
  /////////////////// Add Video ///////////////////

  Template.AddVideoScreen.events({
    'click .addVideo' : function () {
      var newUrl = $('#url').val();
      var videoId = newUrl.split(/[\\=]+/);
      var time = new Date().getTime();
      id = videoId[videoId.length-1];
      vid_id = AmplifiedSession.get('videos_id') ? AmplifiedSession.get('videos_id') : Videos.findOne({room_id: AmplifiedSession.get('room_id')})._id;
      Videos.update({ _id: vid_id}, {$inc:{totalVideos:1},
                                    $push:{videoIds: id},
                                    $set:{modified_on: time}}, function (error) {
        if (error) 
          console.log(error);

        Meteor.Router.to('/rooms/' + AmplifiedSession.get('room_id'));
      });
      
    }
  });

  /////////////////// Create Room ///////////////////

  Template.CreateARoom.events({
    'click .save' : function () {
      console.log('there');
      var newRoomName = $('#name').val();
      var makePrivate = $('#isPrivate').is(':checked');
      Meteor.call("create_room", newRoomName, makePrivate, function(error,room_id) {
        AmplifiedSession.set("room_id", room_id);
        Meteor.call("create_videos", AmplifiedSession.get('room_id'), function(error,videos_id) {
          AmplifiedSession.set("videos_id", videos_id);
          Meteor.Router.to('/rooms/' + AmplifiedSession.get('room_id')  + '/addVideo');
        });
      });
    }
  });

  /////////////////// Find Room ///////////////////

  Template.FindRoom.events({
    'click .goToRoom' : function () {
      var room_id = $('#privateId').val();
      if(Rooms.findOne(room_id))
        Meteor.Router.to('/rooms/' + room_id);
      else 
        $('#error').show();
    }
  });
}

Rooms = new Meteor.Collection("rooms");
Videos = new Meteor.Collection("videosQue");

if (Meteor.isServer) {
  Meteor.startup(function () {
    //Rooms.remove({});
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
                     currentVideoIndex: 0,
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
    AmplifiedSession.set('adding', false);
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
    '/rooms/:id/mode' : function(id) {
      AmplifiedSession.set("room_id", id);
      console.log(AmplifiedSession.get('room_id')); //weird bug, have to print to restore session properly
      return 'ChooseModeScreen';
    },
    '/rooms/:id' : function(id) {
      AmplifiedSession.set("room_id", id);
      AmplifiedSession.set('playing', false);
      console.log(AmplifiedSession.get('room_id')); //weird bug, have to print to restore session properly
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
    '/': 'Home',
    '/contact': 'Contact'
  });

  /////////////////// Browse Rooms ///////////////////

  Template.BrowseRooms.loading = function () {
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

  Template.EnteredRoom.adding = function () {
    return !AmplifiedSession.get('adding');
  };

  Template.EnteredRoom.video_objs = function () {
    return Videos.findOne({room_id: AmplifiedSession.get('room_id')}).videoIds.length;
  };

  Template.EnteredRoom.rendered = function () {
    console.log(AmplifiedSession.get('videos').videoIds.length);

    $("#searchTerms").keyup(function (e) {
        if (e.keyCode == 13) {
            searchVids();
        }
    });
    if(!AmplifiedSession.get('playing') && !AmplifiedSession.get('adding') && AmplifiedSession.get('videos') && AmplifiedSession.get('videos').videoIds.length) {
      $('#youtube-video').show();
      AmplifiedSession.set('playing', true);
      var currVid = 0; // AmplifiedSession.get('videos').currentVideoIndex, 
          playlist = AmplifiedSession.get('videos').videoIds;
      renderVid(playlist, currVid);
    }
  };

  Template.EnteredRoom.videoData = function() {
    AmplifiedSession.set('videos', Videos.findOne({room_id: AmplifiedSession.get('room_id')}));
    var ids = ""
    for(var i = AmplifiedSession.get('haveData') ? AmplifiedSession.get('haveData') : 0; i < AmplifiedSession.get('videos').videoIds.length; i++) {
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
        var color = false;
        $('.playlist').html('');

        for(var i = 0; i < response.items.length; i++) {
          var style = "";
          if (color) 
            style = "blue";
          else 
            style = "purp";
          color = !color;
          
          $('.playlist').append('<div class="next"><span class="future col-lg-12 ' + style + '">' + response.items[i].snippet.title + '<span class="hidden vId">' + i + '</span></span></div>');
        }
      });
    });

    return AmplifiedSession.get('videos').videoIds;
  };

  var video= {};

  var renderVid = function(playlist, currVid) {
    video = Popcorn.smart('#youtube-video', 'http://www.youtube.com/embed/' + playlist[currVid] + '&html5=1');
    video.on("ended", function() {
      playlist = AmplifiedSession.get('videos').videoIds;
      console.log(AmplifiedSession.get('videos').videoIds.length);
      if (++currVid < AmplifiedSession.get('videos').videoIds.length) {
        // if(AmplifiedSession.get('videos').currentVideoIndex < currVid)
        //   Videos.update({ _id: AmplifiedSession.get('videos')._id}, {$set:{currentVideoIndex: currVid}});
        renderVid(playlist, currVid);
      }
      else {
        AmplifiedSession.set('playing', false);
        $('#youtube-video').hide();
        $('.error').show();
      }
    });
  }

  var searchVids = function() {
    var searchTerms = $('#searchTerms').val();
    var request = gapi.client.youtube.search.list({
      q: searchTerms,
      part: 'snippet',
      type: 'video'
    });
    request.execute(function(response) {
      var color;
      for (var i = 0; i < response.result.items.length; i++) {
        var style = "";
        if (color) 
          style = "blue";
        else 
          style = "purp";
        color = !color;

        $('#results').append('<div class="choose"><span class="futue col-lg-12 ' + style + '">' + response.result.items[i].snippet.title + 'from </br>' + response.result.items[i].snippet.channelTitle + '<span class="hidden vId">' + response.result.items[i].id.videoId + '</span></span></div>');
      };
    });
  };

  var getPlaylist = function() {
    
  };

  Template.EnteredRoom.events({
    'click #toAddVideo' : function () {
      AmplifiedSession.set('adding', true);
    },
    'click .delete' : function() {
      AmplifiedSession.set('adding', false);
    },
    'click .searchYoutube' : function() {
      searchVids();
    },
    'click .choose' : function(event) {
      var chosen = event.srcElement.children[1].childNodes[0].data;
      vid_id = AmplifiedSession.get('videos_id') ? AmplifiedSession.get('videos_id') : Videos.findOne({room_id: AmplifiedSession.get('room_id')})._id;
      Videos.update({ _id: vid_id}, {$inc:{totalVideos:1},
                                    $push:{videoIds: chosen}}, function (error) {
        if (error) 
          console.log(error);

        AmplifiedSession.set('adding', false);
      });
      console.log(chosen);
    },
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

        AmplifiedSession.set('adding', false);
      });
    },
    'click .next' : function(event) {
      video.destroy();
      var currVid = event.srcElement.children[0].childNodes[0].data, playlist = AmplifiedSession.get('videos').videoIds;
      renderVid(playlist, currVid);
    }
  });

  /////////////////// Choose Mode ///////////////////

  Template.ChooseModeScreen.events({
    'click .theater' : function() {
      AmplifiedSession.set('mode', 'theater');
    },
    'click .submitter' : function() {
      AmplifiedSession.set('mode', 'submitter');
    }
  });

  Template.ChooseModeScreen.room = function () {
    return Rooms.findOne(AmplifiedSession.get('room_id'));
  };

  /////////////////// Add Video ///////////////////

  Template.AddVideoScreen.videoData = function() {
    AmplifiedSession.set('videos', Videos.findOne({room_id: AmplifiedSession.get('room_id')}));
    var ids = ""
    for(var i = AmplifiedSession.get('haveData') ? AmplifiedSession.get('haveData') : 0; i < AmplifiedSession.get('videos').videoIds.length; i++) {
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
        var color = false;
        $('.playlist').html('');

        for(var i = 0; i < response.items.length; i++) {
          var style = "";
          if (color) 
            style = "blue";
          else 
            style = "purp";
          color = !color;
          
          $('.playlist').append('<div class="next"><span class="future col-lg-12 ' + style + '">' + response.items[i].snippet.title + '<span class="hidden vId">' + i + '</span></span></div>');
        }
      });
    });

    return AmplifiedSession.get('videos').videoIds;
  };

  Template.AddVideoScreen.events({
    'click .addVideo' : function () {
      var newUrl = $('#url').val();
      var time = new Date().getTime();

      if (newUrl.indexOf('youtu') != -1) {
        var videoId = newUrl.split(/[\\=]+/);
        id = videoId[videoId.length-1];
      }

      vid_id = AmplifiedSession.get('videos_id') ? AmplifiedSession.get('videos_id') : Videos.findOne({room_id: AmplifiedSession.get('room_id')})._id;
      Videos.update({ _id: vid_id}, {$inc:{totalVideos:1},
                                    $push:{videoIds: id},
                                    $set:{modified_on: time}}, function (error) {
        if (error) 
          console.log(error);

        if (!AmplifiedSession.equals('mode','submitter')) 
          Meteor.Router.to('/rooms/' + AmplifiedSession.get('room_id'));
      });
      
    }
  });

  /////////////////// Create Room ///////////////////

  Template.CreateARoom.events({
    'click .save' : function () {
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
        Meteor.Router.to('/rooms/' + room_id + '/mode');
      else 
        $('#error').show();
    }
  });
}

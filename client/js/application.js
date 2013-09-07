Rooms = new Meteor.Collection("rooms");
Videos = new Meteor.Collection("videosQue");

Meteor.startup(function () {
  Session.set('room_id', null);
  Session.set('videos', null);
  Session.set('videos_id', null);
  // addvideopage switch add method
  Session.set('linkGrabber', false);
});

var videosHandle = null;

Deps.autorun(function(){
  var room_id = Session.get('room_id');
  if (room_id)
    videosHandle = Meteor.subscribe('videosQue', room_id);
  else
    videosHandle = null;
});

/////////////////// Entered Room ///////////////////
Template.Home.events({
  'click .down' : function() {
    $('html, body').animate({ 
        scrollTop: $('.about').offset().top
    }, 1000);
  }
});

var played;

Template.EnteredRoom.loading = function () {
  return videosHandle && !videosHandle.ready();
};

Template.EnteredRoom.room = function () {
  return Rooms.findOne({urlId:Session.get('room_id')});
};

Template.EnteredRoom.video_objs = function () {
  if (Videos.findOne({room_id: Session.get('room_id')}) && Videos.findOne({room_id: Session.get('room_id')}).videoIds)
    return Videos.findOne({room_id: Session.get('room_id')}).videoIds.length;
  else
    return 0;
};

Template.EnteredRoom.created = function() {
  played = false;
};

Template.EnteredRoom.rendered = function () {
  $("#searchTerms").keyup(function (e) {
    if (e.keyCode == 13)
      searchVids();
  });

  console.log(played);
  if(!played && Session.get('videos') && Session.get('videos').videoIds.length) {
    $('#youtube-video').show();
    played = true;
    var currVid = 0; // Session.get('videos').currentVideoIndex, 
        playlist = Session.get('videos').videoIds;
    
    renderVid(playlist, currVid);
  }
};

Template.EnteredRoom.videoData = function() {
  Session.set('videos', Videos.findOne({room_id: Session.get('room_id')}));
  if (Session.get('videos') && Session.get('videos').videoIds)
    getPlaylist("video");
  return 0;
};

var video= {}, offset = 0;

var renderVid = function(playlist, currVid) {
  changeCurrent(currVid);
  Session.set('currentVideoIndex', currVid);
  video = Popcorn.smart('#youtube-video', 'http://www.youtube.com/embed/' + playlist[currVid] + '&html5=1');
  video.on("ended", function() {
    playlist = Session.get('videos').videoIds;
    if (++currVid < Session.get('videos').videoIds.length) {
      offset += 50;
      $('#playlist').slimScroll({ scrollTo: offset + 'px'});
      renderVid(playlist, currVid);
    } else {
      played = false;
      $('#youtube-video').hide();
      $('.error').show();
    }
  });
};

var changeCurrent = function(newActive) {
  var currVids = Session.get('videos').videoIds.length;
  for (var i = 0; i < currVids; i++) {
    if ($('#vid' + i).hasClass('purpActive')) {
      $('#vid' + i).removeClass('purpActive')
      $('#vid' + i).addClass('purpDull')
    } else if ($('#vid' + i).hasClass('blueActive')) {
      $('#vid' + i).removeClass('blueActive')
      $('#vid' + i).addClass('blueDull')
    } else if ($('#vid' + i).hasClass('greenActive')) {
      $('#vid' + i).removeClass('greenActive')
      $('#vid' + i).addClass('greenDull')
    }
  }
  if ($('#vid' + newActive).hasClass('purpDull')) {
    $('#vid' + newActive).removeClass('purpDull')
    $('#vid' + newActive).addClass('purpActive')
  } else if ($('#vid' + newActive).hasClass('blueDull')) {
    $('#vid' + newActive).removeClass('blueDull')
    $('#vid' + newActive).addClass('blueActive')
  } else if ($('#vid' + newActive).hasClass('greenDull')) {
    $('#vid' + newActive).removeClass('greenDull')
    $('#vid' + newActive).addClass('greenActive')
  }
};

var searchVids = function() {
  var searchTerms = $('#searchTerms').val();
  var request = gapi.client.youtube.search.list({
    q: searchTerms,
    part: 'snippet',
    type: 'video',
    maxResults: 10
  });
  gapi.client.setApiKey("AIzaSyCnGXLE1spj9r30DJAkXCXcrAVCBXV73xM");
  gapi.client.load('youtube', 'v3', function() { 
    request.execute(function(response) {
      var color;
      $('#results').html('');
      for (var i = 0; i < response.result.items.length; i++) {
        var style = color ? "blue" : "purp";
        color = !color;
        $('#results').append('<div class="choose row" id="' + response.result.items[i].id.videoId + '"><img style="padding:0px;" class="col-xs-3" src="http://img.youtube.com/vi/' + response.result.items[i].id.videoId +'/0.jpg" /><span class="future col-xs-9 ' + style + '">' + response.result.items[i].snippet.title + '</br>from ' + response.result.items[i].snippet.channelTitle + '<span class="hidden vId">' + response.result.items[i].id.videoId + '</span></span></div>');
      };
      $('#results').slimScroll({
          position: 'left',
          height: '100%',
          railVisible: true,
          alwaysVisible: true
      });
    });
  });
};

var getPlaylist = function(mode) {
  var ids = "", style;
  for(var i = 0; i < Session.get('videos').videoIds.length; i++) {
    ids += Session.get('videos').videoIds[i];
    if (i < Session.get('videos').videoIds.length - 1)
      ids += ',';
  }
  gapi.client.setApiKey("AIzaSyCnGXLE1spj9r30DJAkXCXcrAVCBXV73xM");
  gapi.client.load('youtube', 'v3', function() { 
    var request = gapi.client.youtube.videos.list({part:'snippet', id: ids});
    request.execute(function(response) {
      $('#playlist').html('');
      for(var i = 0; i < response.items.length; i++) {
        if (i % 3 == 0)
          style = "purpDull";
        if (i % 3 == 1)
          style = "blueDull";
        if (i % 3 == 2) 
          style = "greenDull";
        $('#playlist').append('<div class="next row" style="padding-left:25px;height90%"><span id="vid' + i + '" class="future col-xs-11 ' + style + '">' + response.items[i].snippet.title + '<span class="hidden vId">' + i + '</span></span></div>');
      }
      // $('#playlist').scrollTop($('#playlist')[0].scrollHeight);
      $('#playlist').slimScroll({
          position: 'right',
          height: '100%',
      });
      if(mode == "video") {
        changeCurrent(Session.get('currentVideoIndex'));
        $('#playlist').slimScroll({ scrollTo: $('#vid' + Session.get('currentVideoIndex')).offset().top - 200});
      }
    });
  });
};

Template.EnteredRoom.events({
  'click #toAddVideo' : function () {
    $('.playlist-height').hide();
    $('.addVideoPanel').show();
  },
  'click .delete' : function() {
    $('.playlist-height').show();
    $('.addVideoPanel').hide();
  },
  'click .searchYoutube' : function() {
    searchVids();
  },
  'click .choose' : function(event) {
    var chosen = event.srcElement.children[1].childNodes[0].data;
    vid_id = Session.get('videos_id') ? Session.get('videos_id') : Videos.findOne({room_id: Session.get('room_id')})._id;
    Videos.update({ _id: vid_id}, {$inc:{totalVideos:1},
                                   $push:{videoIds: chosen}}, function (error) {
      if (error) 
        console.log(error);

      $('.playlist-height').show();
      $('.addVideoPanel').hide();
    });
  },
  'click .next' : function(event) {
    video.destroy();
    var currVid = event.srcElement.children[0].childNodes[0].data, playlist = Session.get('videos').videoIds;
    var currVid1 = Session.get('currentVideoIndex');
    if ($('#vid' + currVid1).hasClass('purpActive')) {
      $('#vid' + currVid1).removeClass('purpActive')
      $('#vid' + currVid1).addClass('purpDull')
    } else if ($('#vid' + currVid1).hasClass('blueActive')) {
      $('#vid' + currVid1).removeClass('blueActive')
      $('#vid' + currVid1).addClass('blueDull')
    } else if ($('#vid' + currVid1).hasClass('greenActive')) {
      $('#vid' + currVid1).removeClass('greenActive')
      $('#vid' + currVid1).addClass('greenDull')
    }
    if ($('#vid' + currVid ).hasClass('purpDull')) {
      $('#vid' + currVid ).removeClass('purpDull')
      $('#vid' + currVid ).addClass('purpActive')
    } else if ($('#vid' + currVid ).hasClass('blueDull')) {
      $('#vid' + currVid ).removeClass('blueDull')
      $('#vid' + currVid ).addClass('blueActive')
    } else if ($('#vid' + currVid ).hasClass('greenDull')) {
      $('#vid' + currVid ).removeClass('greenDull')
      $('#vid' + currVid ).addClass('greenActive')
    }
    renderVid(playlist, currVid);
  },
  'click #toFullscreen' : function() {
    var target = $('.currRoom')[0];
    if (screenfull.enabled) 
      screenfull.toggle(target);
  },
  'click #previous' : function() {
    if (Session.get('currentVideoIndex') > 0) {
      video.destroy();
      var playlist = Session.get('videos').videoIds;
      offset -= 50;
      $('#playlist').slimScroll({ scrollTo: offset + 'px'});
      renderVid(playlist, Session.get('currentVideoIndex') - 1);
    }
  },
  'click #nextVideo' : function() {
    if (Session.get('currentVideoIndex') + 1 < Session.get('videos').videoIds.length) {
      video.destroy();
      var playlist = Session.get('videos').videoIds;
      offset += 50;
      $('#playlist').slimScroll({ scrollTo: offset + 'px'});
      renderVid(playlist, Session.get('currentVideoIndex') + 1);
    }
  }
});

/////////////////// Add Video ///////////////////

Template.AddVideoScreen.room = function () {
  return Rooms.findOne({urlId: Session.get('room_id')});
};

Template.AddVideoScreen.videoData = function() {
  Session.set('videos', Videos.findOne({room_id: Session.get('room_id')}));
  if (Session.get('videos') && Session.get('videos').videoIds) 
    getPlaylist();

  return "Loading";
};

Template.AddVideoScreen.linkGrabber = function() {
  return Session.get('linkGrabber');
};

Template.AddVideoScreen.events({
  'click .addVideo' : function () {
    var newUrl = $('#url').val();
    var time = new Date().getTime();

    if (newUrl.indexOf('youtu') != -1) 
      var id = /^.*(?:\/|v=)(.{11})/.exec( newUrl )[ 1 ];
    
    if(id) {
      vid_id = Session.get('videos_id') ? Session.get('videos_id') : Videos.findOne({room_id: Session.get('room_id')})._id;
      Videos.update({ _id: vid_id}, {$inc:{totalVideos:1},
                                     $push:{videoIds: id},
                                     $set:{modified_on: time}}, function (error) {
        if (error) 
          console.log(error);

        if (!Session.equals('mode','submitter')) 
          Meteor.Router.to('/rooms/' + Session.get('room_id'));
        $("#url").val("");
        (function (el) {
            setTimeout(function () {
                el.children().remove('p');
            }, 5000);
        }($('.success').append('<p class="successMessage">Success!</p>')));
      });
    }
  },
  'click .searchMedia' : function() {
    Session.set('linkGrabber', false);
  },
  'click .grabLinks' : function() {
    Session.set('linkGrabber', true);
  },
  'click .searchYoutube' : function() {
    searchVids();
  },
  'click .choose' : function(event) {
        console.log(event);
    var chosen = event.srcElement.children[1].childNodes[0].data;
    vid_id = Session.get('videos_id') ? Session.get('videos_id') : Videos.findOne({room_id: Session.get('room_id')})._id;
    Videos.update({ _id: vid_id}, {$inc:{totalVideos:1},
                                   $push:{videoIds: chosen}}, function (error) {
      if (error) 
        console.log(error);
      $('#results').html('');
      $('#searchTerms').val('');
      Session.set('adding', false);
    });
  }
});
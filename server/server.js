Rooms = new Meteor.Collection("rooms");
Videos = new Meteor.Collection("videosQue"); 


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

var urlIdCounter;
function S4() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

var generateUid = function () {  
  return (S4() + S4() + delim + S4() + delim + S4() + delim + S4() + delim + S4() + S4() + S4());
};

var newId = function() {
  var counter, urlId;
  if (urlIdCounter === undefined) 
    counter = 0;
  else
    counter = ++urlIdCounter;
  console.log(urlIdCounter);

  urlId = S4() + counter.toString();
  return urlId;
};

var lastCreate;

Rooms.allow({    
  'insert': function(userId, doc) { 
    var date = new Date();   
    if (lastCreate === undefined) {
      lastCreate = date;
      return true;
    } else if (!(lastCreate.getHours() - date.getHours()) && Math.abs(lastCreate.getMinutes() - date.getMinutes()) < 5) {
      return false;
    }      
    return true;
  },

  'update': function() {
    return false;
  },

  'remove': function() {
    return false;              
  }           
});

Videos.allow({    
  'insert': function(userId, doc) { 
    return false;
  },

  'update': function() {
    return true;
  },

  'remove': function() {
    return false;              
  }           
}); 

Meteor.methods({
  create_room: function(roomName, private1) {
    console.log("CREATING ROOM");
    var urlId = newId();
    var room_id = Rooms.insert({name: roomName,
                              urlId: urlId, 
                              isPrivate: private1, 
                              modified_on: new Date().getTime()});
    return urlId;
  },
  create_videos: function(room_id, urlId) {
    console.log("CREATING VIDEOS FOR ROOM");
    var videos_id = Videos.insert({videos: [],
                   videoIds: [],
                   totalVideos: 0,
                   currentVideoIndex: 0,
                   room_id: room_id});
    return videos_id;
  }
});
Rooms = new Meteor.Collection "rooms" 
Videos = new Meteor.Collection "videosQue" 

Meteor.startup ->
 #Rooms.remove({})
 
Meteor.publish 'rooms', ->
  Rooms.find()

Meteor.publish 'videosQue', (room_id) ->
  Videos.find room_id: room_id

urlIdCounter = if urlIdCounter? then urlIdCounter else 0
newId = -> 
  urlId = (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)+ urlIdCounter.toString()

Rooms.allow
  'insert': -> true
  'update': -> false
  'remove': -> false

Videos.allow   
  'insert': -> false
  'update': -> true
  'remove': -> false

Meteor.methods
  create_room: (roomName, private1) ->
    console.log "CREATING ROOM"
    urlId = newId()
    room_id = Rooms.insert
      name: roomName
      urlId: urlId
      isPrivate: private1
      modified_on: new Date().getTime()
    urlId
  create_videos: (room_id, urlId) ->
    console.log "CREATING VIDEOS FOR ROOM"
    videos_id = Videos.insert
      videos: []
      videoIds: []
      totalVideos: 0
      currentVideoIndex: 0
      room_id: room_id
    videos_id
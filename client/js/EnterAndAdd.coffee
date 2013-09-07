videosHandle = null

Deps.autorun ->
  room_id = Session.get 'room_id'
  if room_id 
    videosHandle = Meteor.subscribe 'videosQue', room_id 
  else
    videosHandle = null

Template.EnteredRoom.loading = ->
  videosHandle && !videosHandle.ready()

Template.EnteredRoom.room = -> 
  Rooms.findOne urlId: Session.get 'room_id' 

Template.EnteredRoom.adding = ->
  !Session.get 'adding' 

Template.EnteredRoom.video_objs = ->
  if Videos.findOne(room_id: Session.get('room_id')) && Videos.findOne(room_id: Session.get('room_id')).videoIds
    Videos.findOne(room_id: Session.get('room_id')).videoIds.length
  else
    0

Template.EnteredRoom.rendered = ->
  $("#searchTerms").keyup (e) ->
    if e.keyCode == 13
      searchVids();
  console.log(Session.get('playing'))
  if !Session.get('playing') && !Session.get('adding') && Session.get('videos') && Session.get('videos').videoIds.length
    $('#youtube-video').show();
    Session.set 'playing', true
    console.log(Session.get('playing'))
    currVid = 0
    playlist = Session.get('videos').videoIds
    renderVid playlist, currVid

Template.EnteredRoom.videoData = ->
  Session.set 'videos', Videos.findOne(room_id: Session.get('room_id'))
  if Session.get('videos') && Session.get('videos').videoIds
    getPlaylist()
  0

video = {}

changeCurrent = ->
  currVid = Session.get('currentVideoIndex')
  if $('#vid' + currVid).hasClass('purpActive') 
    $('#vid' + currVid).removeClass('purpActive')
    $('#vid' + currVid).addClass('purpDull')
  if $('#vid' + currVid).hasClass('blueActive') 
    $('#vid' + currVid).removeClass('blueActive')
    $('#vid' + currVid).addClass('blueDull')
  if $('#vid' + currVid).hasClass('greenActive') 
    $('#vid' + currVid).removeClass('greenActive')
    $('#vid' + currVid).addClass('greenDull')

  if $('#vid' + (currVid + 1)).hasClass('purpDull') 
    $('#vid' + (currVid + 1)).removeClass('purpDull')
    $('#vid' + (currVid + 1)).addClass('purpActive')
  if $('#vid' + (currVid + 1)).hasClass('blueDull') 
    $('#vid' + (currVid + 1)).removeClass('blueDull')
    $('#vid' + (currVid + 1)).addClass('blueActive')
  if $('#vid' + (currVid + 1)).hasClass('greenDull') 
    $('#vid' + (currVid + 1)).removeClass('greenDull')
    $('#vid' + (currVid + 1)).addClass('greenActive')

renderVid = (playlist, currVid) ->
  Session.set 'currentVideoIndex', currVid
  video = Popcorn.smart '#youtube-video', 'http://www.youtube.com/embed/' + playlist[currVid] + '&html5=1'

  video.on "ended", () ->
    playlist = Session.get('videos').videoIds
    if  ++currVid < Session.get('videos').videoIds.length
      changeCurrent()
      renderVid playlist, currVid
    else 
      Session.set 'playing', false
      $('#youtube-video').hide()
      $('.error').show()

searchVids = ->
  searchTerms = $('#searchTerms').val()
  request = gapi.client.youtube.search.list
    q: searchTerms
    part: 'snippet'
    type: 'video'
    maxResults: 10
  gapi.client.setApiKey "AIzaSyCnGXLE1spj9r30DJAkXCXcrAVCBXV73xM"
  gapi.client.load 'youtube', 'v3', ->
    request.execute (response) ->
      color = false;
      $('#results').html ''
      for element in response.result.items
        style = if color then "blue" else "purp"
        color = !color
        $('#results').append '<div class="choose row" id="' + element.id.videoId + '"><img style="padding:0px;" class="col-xs-3" src="http://img.youtube.com/vi/' + element.id.videoId + '/0.jpg" /><span class="future col-xs-9 ' + style + '">' + element.snippet.title + '</br>from ' + element.snippet.channelTitle + '<span class="hidden vId">' + element.id.videoId + '</span></span></div>'

      $('#results').mCustomScrollbar
        theme: "light"
        scrollInertia: 0

getPlaylist = () ->
  ids = ''
  for element in Session.get('videos').videoIds
    ids += element + ','
  ids.slice 0, - 1
  color = false
  
  gapi.client.setApiKey "AIzaSyCnGXLE1spj9r30DJAkXCXcrAVCBXV73xM"
  gapi.client.load 'youtube', 'v3', ->
    request = gapi.client.youtube.videos.list 
      part:'snippet'
      id: ids
    request.execute (response) ->
      $('#playlist').html '' 
      for element, index in response.items
        if index % 3 == 0
          style = "purpDull" 
        if index % 3 == 1
          style = "blueDull"
        if index % 3 == 2 
          style = "greenDull"
        $('#playlist').append '<div class="next row"><span id="vid' + index + '" class="future col-sm-11 ' + style + '">' + element.snippet.title + '<span class="hidden vId">' + index + '</span></span></div>'
      
      $('#playlist').scrollTop $('#playlist')[0].scrollHeight
      $("#playlist").mCustomScrollbar
          theme:"light"

      currVid = Session.get('currentVideoIndex')
      if $('#vid' + currVid).hasClass('purpDull') 
        $('#vid' + currVid).removeClass('purpDull')
        $('#vid' + currVid).addClass('purpActive')
      if $('#vid' + currVid).hasClass('blueDull') 
        $('#vid' + currVid).removeClass('blueDull')
        $('#vid' + currVid).addClass('blueActive')
      if $('#vid' + currVid).hasClass('greenDull') 
        $('#vid' + currVid).removeClass('greenDull')
        $('#vid' + currVid).addClass('greenActive')

      # if currVid > 0
      #   classList = document.getElementById('vid' + (currVid - 1)).className.split(/\s+/)
      #   for element in classList
      #     if (element == 'purpDull') 
      #       $('vid' + (currVid - 1)).removeClass('purpActive')
      #       $('vid' + (currVid - 1)).addClass('purpDull')
      #     if (element == 'blueDull') 
      #       $('vid' + (currVid - 1)).removeClass('blueActive')
      #       $('vid' + (currVid - 1)).addClass('blueDull')
      #     if (element == 'greenDull') 
      #       $('vid' + (currVid - 1)).removeClass('greenActive')
      #       $('vid' + (currVid - 1)).addClass('greenDull')

Template.EnteredRoom.events
  'click #toAddVideo' : -> Session.set 'adding', true
  'click .delete' : -> Session.set 'adding', false
  'click .searchYoutube' : -> searchVids()
  'click .choose' : (event) ->
    chosen = event.srcElement.children[1].childNodes[0].data
    vid_id = if Session.get('videos_id') then Session.get('videos_id') else Videos.findOne(room_id: Session.get('room_id'))._id
    Videos.update _id: vid_id, 
      $inc:
        totalVideos: 1
      $push:
        videoIds: chosen
      ,(error) ->
        if error
          console.log error
        Session.set 'adding', false
  'click .next' : (event) ->
    video.destroy()
    currVidF = event.srcElement.children[0].childNodes[0].data
    playlist = Session.get('videos').videoIds
    currVid = Session.get('currentVideoIndex')
    if $('#vid' + currVid).hasClass('purpActive') 
      $('#vid' + currVid).removeClass('purpActive')
      $('#vid' + currVid).addClass('purpDull')
    if $('#vid' + currVid).hasClass('blueActive') 
      $('#vid' + currVid).removeClass('blueActive')
      $('#vid' + currVid).addClass('blueDull')
    if $('#vid' + currVid).hasClass('greenActive') 
      $('#vid' + currVid).removeClass('greenActive')
      $('#vid' + currVid).addClass('greenDull')

    if $('#vid' + currVidF).hasClass('purpDull') 
      $('#vid' + currVidF).removeClass('purpDull')
      $('#vid' + currVidF).addClass('purpActive')
    if $('#vid' + currVidF).hasClass('blueDull') 
      $('#vid' + currVidF).removeClass('blueDull')
      $('#vid' + currVidF).addClass('blueActive')
    if $('#vid' + currVidF).hasClass('greenDull') 
      $('#vid' + currVidF).removeClass('greenDull')
      $('#vid' + currVidF).addClass('greenActive')
    renderVid playlist, currVidF
  'click #toFullscreen' : ->
    target = $('.currRoom')[0]
    if screenfull.enabled  
      screenfull.toggle target 
  'click #previous' : ->
    if Session.get('currentVideoIndex') > 0 
      video.destroy()
      playlist = Session.get('videos').videoIds
      renderVid playlist, Session.get('currentVideoIndex') - 1
  'click #nextVideo' : ->
    if Session.get('currentVideoIndex') + 1 < Session.get('videos').videoIds.length  
      video.destroy()
      playlist = Session.get('videos').videoIds
      changeCurrent()
      renderVid playlist, Session.get('currentVideoIndex') + 1

Template.AddVideoScreen.room = ->
  Rooms.findOne urlId: Session.get 'room_id' 

Template.AddVideoScreen.videoData = ->
  Session.set 'videos', Videos.findOne room_id: Session.get 'room_id'
  if Session.get('videos') && Session.get('videos').videoIds
    getPlaylist()
  "Loading"

Template.AddVideoScreen.linkGrabber = ->
  Session.get 'linkGrabber'

Template.AddVideoScreen.events
  'click .addVideo' : ->
    newUrl = $('#url').val()
    time = new Date().getTime()

    if newUrl.indexOf('youtu') != -1
      pattern = ///^.*(?:/|v=)(.11)///
      id = pattern.exec( newUrl )[ 1 ]
  
    if id  
      vid_id = if Session.get('videos_id') then Session.get('videos_id') else Videos.findOne(room_id: Session.get('room_id'))._id
      Videos.update _id: vid_id, 
        $inc:totalVideos:1
        $push:videoIds: id
        $set:modified_on: time
        , (error) ->
          if error
            console.log error
          if !Session.equals 'mode','submitter' 
            Meteor.Router.to '/rooms/' + Session.get 'room_id'
          $("#url").val ""
  'click .searchMedia' : -> Session.set 'linkGrabber', false
  'click .grabLinks' : -> Session.set 'linkGrabber', true
  'click .searchYoutube' : -> searchVids()
  'click .choose' : (event) ->
    console.log event
    chosen = event.srcElement.children[1].childNodes[0].data
    vid_id = if Session.get('videos_id') then Session.get('videos_id') else Videos.findOne(room_id: Session.get('room_id'))._id
    Videos.update _id: vid_id, 
      $inc:totalVideos:1
      $push:videoIds: chosen
      , (error) ->
        if  error  
          console.log error
        $('#results').html ''
        $('#searchTerms').val ''
        Session.set 'adding', false
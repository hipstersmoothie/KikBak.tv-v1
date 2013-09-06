setState = (state) ->
  date = new Date()
  localStorage.setItem 'state', state 
  localStorage.setItem 'stateTime', date.getTime()

Meteor.Router.add
  '/rooms/new/add': ->
    setState '/rooms/new/add'
    'CreateARoom'
  '/rooms/find': ->
    setState '/rooms/find'
    'FindRoom'
  '/rooms/:id/addVideo' : (id) ->
    setState '/rooms/' + id + '/addVideo' 
    Session.set 'room_id', id 
    if Session.get "room_id" 
      'AddVideoScreen'
  '/rooms/:id/mode' : (id) ->
    setState '/rooms/' + id + '/mode'
    Session.set "room_id", id
    if Session.get "room_id" 
      'ChooseModeScreen'
  '/rooms/:id' : (id) ->
    setState '/rooms/' + id
    Session.set 'room_id', id
    Session.set 'playing', false 
    if Session.get "room_id" 
      'EnteredRoom'
  '/rooms' : ->
    setState '/rooms'
    Session.set 'room_id', null
    Session.set 'videos', null
    Session.set 'videos_id', null
    Session.set 'playing', false
    'BrowseRooms'
  '/about' : 'about'
  '/loadingPage' :' loadingPage'
  '/': ->
    currDate = new Date()
    iOS = if navigator.userAgent.match ///(iPad|iPhone|iPod)///g  then true else false
    if localStorage.getItem('stateTime') && currDate.getTime() - localStorage.getItem('stateTime')<= 3600000 && iOS && window.navigator.standalone
      Meteor.Router.to localStorage.getItem('state') 
    'Home'
  '/contact': 'Contact'
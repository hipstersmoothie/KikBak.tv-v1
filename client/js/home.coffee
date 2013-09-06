Template.Home.events
  'click .down' : ->
    $('html, body').animate
        scrollTop: $('.about').offset().top , 1000
// YOUR CODE HERE:

var app;
$(function() {
  app = {
//TODO: The current 'addFriend' function just adds the class 'friend'
//to all messages sent by the user
    server: 'http://127.0.0.1:3000/classes/',
    username: 'anonymous',
    roomname: 'Lobby',
    lastMessageDate: 0,
    friends: {},
    rooms: [],

    init: function() {
      // Get username
      app.username = window.location.search.substr(10);

      // Cache jQuery selectors
      app.$main = $('#main');
      app.$message = $('#message');
      app.$chats = $('#chats');
      app.$roomSelect = $('#roomSelect');
      app.$send = $('#send');

      // Add listeners
      app.$main.on('click', '.username', app.addFriend);
      app.$send.on('submit', app.handleSubmit);
      app.$roomSelect.on('change', app.saveRoom);

      // Fetch previous messages
      app.startSpinner();
      app.initRooms();
      app.fetch(false);

      // Poll for new messages
      setInterval(app.fetch, 3000);
    },
    send: function(data) {
      app.startSpinner();
      // Clear messages input
      app.$message.val('');

      // POST the message to the server
      $.ajax({
        url: app.server + 'messages',
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json',
        success: function (data) {
          console.log('chatterbox: Message sent');
          // Trigger a fetch to update the messages, pass true to animate
          app.fetch();
        },
        error: function (data) {
          console.error('chatterbox: Failed to send message');
        }
      });
    },
    fetch: function(animate) {
      $.ajax({
        url: app.server + 'messages',
        type: 'GET',
        contentType: 'application/json',
        // data: { order: '-createdAt'},
        success: function(data) {
          console.log('chatterbox: Messages fetched');

          // Don't bother if we have nothing to work with
          if (!data.results || !data.results.length) { return; }

          // Get the last message
          var mostRecentMessage = data.results[data.results.length-1];
          var displayedRoom = $('.chat span').first().data('roomname');
          app.stopSpinner();
          // Only bother updating the DOM if we have a new message
          if (mostRecentMessage.createdAt > app.lastMessageDate || app.roomname !== displayedRoom) {
            // Update the UI with the fetched rooms
            //app.populateRooms(data.results);
            app.getRooms();

            // Update the UI with the fetched messages
            app.populateMessages(data.results, animate);

            // Store the ID of the most recent message
            app.lastMessageDate = mostRecentMessage.createdAt;
          }
        },
        error: function(data) {
          console.error('chatterbox: Failed to fetch messages');
        }
      });
    },
    clearMessages: function() {
      app.$chats.html('');
    },
    populateMessages: function(results, animate) {
      // Clear existing messages

      app.clearMessages();
      app.stopSpinner();
      if (Array.isArray(results)) {
        // Add all fetched messages
        results.forEach(app.addMessage);
      }

      // Make it scroll to the bottom
      var scrollTop = app.$chats.prop('scrollHeight');
      if (animate) {
        app.$chats.animate({
          scrollTop: scrollTop
        });
      }
      else {
        app.$chats.scrollTop(scrollTop);
      }
    },
    initRooms: function() {
      app.$roomSelect.html('<option value="__newRoom">New room...</option>');
    },
    populateRooms: function(results) {

      results.forEach(function(room){
        if(app.rooms.indexOf(room) === -1){
          app.rooms.push(room);
          app.addRoom(room);
        };
      });

      // Select the menu option
      app.$roomSelect.val(app.roomname);
    },
    addRoom: function(roomname) {
      // Prevent XSS by escaping with DOM methods
      var $option = $('<option/>').val(roomname).text(roomname);

      // Add to select
      app.$roomSelect.append($option);
    },
    addMessage: function(data) {
      if (!data.roomname)
        data.roomname = 'lobby';

      // Only add messages that are in our current room
      if (data.roomname === app.roomname) {
        // Create a div to hold the chats
        var $chat = $('<div class="chat"/>');

        // Add in the message data using DOM methods to avoid XSS
        // Store the username in the element's data
        var $username = $('<span class="username"/>');
        $username.text(data.username+': ').attr('data-username', data.username).attr('data-roomname',data.roomname).appendTo($chat);

        // Add the friend class
        if (app.friends[data.username] === true)
          $username.addClass('friend');

        var $message = $('<br><span/>');
        $message.text(data.text).appendTo($chat);

        // Add the message to the UI
        app.$chats.append($chat);
      }
    },
    addFriend: function(evt) {
      var username = $(evt.currentTarget).attr('data-username');

      if (username !== undefined) {
        console.log('chatterbox: Adding %s as a friend', username);

        // Store as a friend
        app.friends[username] = true;

        // Bold all previous messages
        // Escape the username in case it contains a quote
        var selector = '[data-username="'+username.replace(/"/g, '\\\"')+'"]';
        var $usernames = $(selector).addClass('friend');
      }
    },
    saveRoom: function(evt) {

      var selectIndex = app.$roomSelect.prop('selectedIndex');
      // New room is always the first option
      if (selectIndex === 0) {
        var roomname = prompt('Enter room name');
        if (roomname) {
          // Set as the current room
          app.roomname = roomname;
          app.rooms.push(roomname);

          // Add the room to the menu
          app.addRoom(roomname);

          // send new room to server
          app.sendRoom(roomname);

          // Select the menu option
          app.$roomSelect.val(roomname);

          // Fetch messages again
          app.fetch();
        }
      }
      else {
        app.startSpinner();
        // Store as undefined for empty names
        app.roomname = app.$roomSelect.val();

        // Fetch messages again
        app.fetch();
      }
    },
    sendRoom: function(roomname) {
      $.ajax({
        url: app.server + 'rooms',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(roomname),
        success: function(data) {
          console.log('SUCCESS: ' + data);
          app.getRooms();
        },
        error: function(data) {
          console.log('FAILED: ' + data);
        }
      });
    },
    getRooms: function() {
      $.ajax({
        url: app.server + 'rooms',
        type: 'GET',
        contentType: 'application/json',
        success: function(data) {
          app.populateRooms(data.results);
        },
        error: function(data){
          console.log('failed to get rooms: ', data)
        }
      });
    },
    handleSubmit: function(evt) {
      var message = {
        username: app.username,
        text: app.$message.val(),
        roomname: app.roomname || 'lobby',
        createdAt: +new Date()
      };

      app.send(message);

      // Stop the form from submitting
      evt.preventDefault();
    },
    startSpinner: function(){
      $('.spinner img').show();
      $('form input[type=submit]').attr('disabled', "true");
    },

    stopSpinner: function(){
      $('.spinner img').fadeOut('fast');
      $('form input[type=submit]').attr('disabled', null);
    }
  };
}());

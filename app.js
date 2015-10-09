function Song (artist, title) {
  this.artist = artist;
  this.title = title;
}

function JamSession (name) {
  this.name = name;
  this.songs = [];
  var now = new Date();
  this.date = now;
}

function searchAPI(artist, song) {
  $.getJSON("http://lyrics.wikia.com/api.php?callback=?",
  {
    func: 'getSong',
    artist: artist,
    song: song,
    fmt: 'realjson' // legacy fix... see docs
  },
    function(data) {
      console.log(data);
      $('iframe').attr("src", data.url);
  });
}

function toggleMainDropdown(display, session) {
  hideStuff();
  if (display === "session_open") {
    $("#session_open").show();
    $(".display_open_session").show();
    $(".display_open_session").text(session);
  }
  else if (display === "session_noopen") {
    $("#session_noopen").show();
  }
  else console.log("Something bad happened");
}

//
// hideStuff toggles all displays off prior to the right ones being
// turned back on. Also resets input form value fields.
//
function hideStuff() {
  $("#session_open").hide();
  $("#session_noopen").hide();
  $(".new_session_form").hide();
  $("#new_session_input").val("");
  $(".existing_session_form").hide();
  $("#existing_session_dropdown").val("");
  $(".new_song_form").hide();
  $("#song").val("");
  $("#artist").val("");
  $(".existing_song_form").hide();
  $("#existing_songs_dropdown").val("");
  $(".display_open_session").hide();
}

//
// parseSong takes a song string in the form of
// "song - artist" along with a selector that specifies
// whether the song or the artist is being parsed out.
// Returns the song or artist depending on the selector,
// i.e. has to be called twice to get both.
//
function parseSong(song, which) {
  var i = 0, j = 0;
  if (which === "song") {
    while (song[i] !== "-") {
      i++;
    }
    // return the song name
    return song.substring(0, i - 1);
  }
  else if (which === "artist") {
    while (song[j] !== "-") {
      j++;
    }
    // return the artist name
    return song.substring(j + 2, song.length);
  }
}

//
// Returns the index of the current open jam session
//
function currentSessionIndex(jamSessions, session) {
  for (var i = 0; i < jamSessions.length; i++) {
    if (jamSessions[i].name === session)
      return i;
  }
}

//
// Upon opening an existing jam session, populateSessionSongs
// pulls that session's setlist from the central jamSessions
// repository and loads the setlist into <ul class="song_list">
//
function populateSessionSongs(jamSessions, session) {
  var sessionIndex = currentSessionIndex(jamSessions, session);
  for (var i = 0; i < jamSessions[sessionIndex].songs.length; i++) {
    $(".song_list").append("<li><a href='#'>" +
      jamSessions[sessionIndex].songs[i].title + " - " +
      jamSessions[sessionIndex].songs[i].artist + "</a></li>");
  }
}

//
// Activate all the event listeners
//
function setupListeners(jamSessions, songList) {

  $("#new_jam_session").on("click", function() {
    hideStuff();
    $("#session_noopen").show();
    $(".new_session_form").show();
  });

  $("#open_existing").on("click", function() {
    hideStuff();
    $("#session_noopen").show();
    $(".existing_session_form").show();
  });

  $("#add_new_song").on("click", function() {
    hideStuff();
    $("#session_open").show();
    $(".new_song_form").show();
  });

  $("#add_existing_song").on("click", function() {
    hideStuff();
    $("#session_open").show();
    $(".existing_song_form").show();
  });

  $("#save_and_close").on("click", function() {
    var currentSession = $(".display_open_session").text();
    var sessionIndex = currentSessionIndex(jamSessions, currentSession);
    for (var i = 0; i < $(".song_list li").size(); i++) {
      // save the song title to current jam session
      jamSessions[sessionIndex].songs[i].title =
        parseSong($(".song_list").children()[i].innerText, "song");
      // ... and the artist
      jamSessions[sessionIndex].songs[i].artist =
        parseSong($(".song_list").children()[i].innerText, "artist");
    }
    localStorage.setItem("jamSessions", JSON.stringify(jamSessions));
    $(".song_list").empty();
    toggleMainDropdown("session_noopen");
  });

  $(".new_session_form").on("submit", function() {
    var session = new JamSession($(this.new_session_input).val());
    jamSessions.push(session);
    localStorage.setItem("jamSessions", JSON.stringify(jamSessions));
    toggleMainDropdown("session_open", $(this.new_session_input).val());
  });

  $(".existing_session_form").on("submit", function() {
    var currentSession = $(this.existing_session_dropdown).val();
    toggleMainDropdown("session_open", currentSession);
    populateSessionSongs(jamSessions, currentSession);
  });

  $(".new_song_form").on("submit", function() {
    var currentSession = $(".display_open_session").text();
    var sessionIndex = currentSessionIndex(jamSessions, currentSession);
    var artist = $(this.artist).val();
    var song = $(this.song).val();
    var new_song = new Song(artist, song);
    // add the song to the master song list
    songList.push(new_song);
    // add the song to the current jam session's song list
    jamSessions[sessionIndex].songs.push(new_song);
    // add the song to the #existing_songs datalist
    $("#existing_songs").append("<option value='" + song + " - " + artist + "'>");
    // add the song to the .song_list <ul> element
    $(".song_list").append("<li><a href='#'>" + song + " - " + artist + "</a></li>");
    // update localStorage
    localStorage.setItem("songList", JSON.stringify(songList));
    localStorage.setItem("jamSessions", JSON.stringify(jamSessions));
    // reset the main dropdown / input forms
    toggleMainDropdown("session_open", currentSession);
  });

  $(".existing_song_form").on("submit", function() {
    var currentSession = $(".display_open_session").text();
    var sessionIndex = currentSessionIndex(jamSessions, currentSession);
    var selectedSong = $(this.existing_songs_dropdown).val();
    var song = parseSong(selectedSong, "song");
    var artist = parseSong(selectedSong, "artist");
    var new_song = new Song(artist, song);
    $(".song_list").append("<li><a href='#'>" + selectedSong + "</a></li>");
    jamSessions[sessionIndex].songs.push(new_song);
    toggleMainDropdown("session_open", currentSession);
  });

  $(".song_list").on("click", "li", function() {
    var clicked_song = $(this).text();
    var artist = parseSong(clicked_song, "artist");
    var song = parseSong(clicked_song, "song");
    searchAPI(artist, song);
  });

  $(".search_form").on("submit", function() {
    searchAPI($(this.search_artist).val(), $(this.search_song).val());
  });
}

//
// values for 'existing song' and 'existing jam session' dropdowns
// are stored in <datalist> elements.  These are populated from
// localStorage on page load
//
function populateDatalists(jamSessions, songList) {
  for (var i = 0; i < songList.length; i++) {
    var artist = songList[i].artist;
    var song = songList[i].title;
    $("#existing_songs").append("<option value='" + song + " - " + artist + "'>");
  }
  for (var j = 0; j < jamSessions.length; j++) {
    var session = jamSessions[j].name;
    $("#existing_sessions").append("<option value='" + session + "'>");
  }
}

function initializeJS() {
  var retrieveSessionsJSON = localStorage.getItem("jamSessions");
  if (retrieveSessionsJSON !== null)
    return JSON.parse(retrieveSessionsJSON);
  else
    return [];
}

function initializeSL() {
  var retrieveSongsJSON = localStorage.getItem("songList");
  if (retrieveSongsJSON !== null)
    return JSON.parse(retrieveSongsJSON);
  else
    return [];
}

$(document).ready(function() {

  var jamSessions = initializeJS();
  var songList = initializeSL();
  console.log(jamSessions, songList);

  populateDatalists(jamSessions, songList);
  setupListeners(jamSessions, songList);
  hideStuff();
  $("#session_noopen").show();

});


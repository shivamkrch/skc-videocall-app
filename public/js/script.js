$(function() {
  var socket = io();

  let showOnlineUsers = false;
  const videoCallEl = $("#video");
  const myVideo = $("#myVideo");
  const frndsVideo = $("#friendsVideo");
  const onlineUsersDiv = $("#onlineUsers");
  const menuBtn = $(".menu-btn");
  const fullScreenBtn = $("#fullScreenBtn");

  $("#loginBtn").click(function(e) {
    $("#formDiv").hide();
    $("#dashboard").show();
    if ($(window).innerWidth() <= 768) {
      menuBtn.show();
    }
    e.preventDefault();
  });

  menuBtn.click(function() {
    if (!showOnlineUsers) {
      menuBtn.addClass("close");
      onlineUsersDiv.addClass("show");
      showOnlineUsers = true;
    } else {
      menuBtn.removeClass("close");
      onlineUsersDiv.removeClass("show");
      showOnlineUsers = false;
    }
  });

  fullScreenBtn.click(function() {
    if (!document.fullscreen) {
      var x = videoCallEl.requestFullScreen();
      fullScreenBtn.removeClass("fa-expand").addClass("fa-compress");
    } else {
      document.exitFullscreen();
      fullScreenBtn.removeClass("fa-compress").addClass("fa-expand");
    }
  });
});

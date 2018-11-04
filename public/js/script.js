var socket = io();

let showOnlineUsers = false;
const videoCallEl = $("#video");
const myVideo = $("#myVideo");
const frndsVideo = $("#friendsVideo");
const onlineUsersDiv = $("#onlineUsers");
const menuBtn = $(".menu-btn");
const fullScreenBtn = $("#fullScreenBtn");

menuBtn.click(function() {
  if (!showOnlineUsers) {
    menuBtn.addClass("close");
    onlineUsersDiv.addClass("show fadeInRight").removeClass("fadeOutRight");
    showOnlineUsers = true;
  } else {
    menuBtn.removeClass("close");
    onlineUsersDiv.addClass("fadeOutRight");
    showOnlineUsers = false;
  }
});

fullScreenBtn.click(function() {
  if (!document.fullscreen) {
    if (videoCallEl.requestFullscreen) {
      videoCallEl.requestFullscreen();
    } else if (videoCallEl.mozRequestFullScreen) {
      /* Firefox */
      videoCallEl.mozRequestFullScreen();
    } else if (videoCallEl.webkitRequestFullscreen) {
      /* Chrome, Safari and Opera */
      videoCallEl.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    } else if (videoCallEl.msRequestFullscreen) {
      /* IE/Edge */
      videoCallEl.msRequestFullscreen();
    }
    fullScreenBtn.removeClass("fa-expand").addClass("fa-compress");
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      /* Firefox */
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      /* Chrome, Safari and Opera */
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      /* IE/Edge */
      document.msExitFullscreen();
    }
    fullScreenBtn.removeClass("fa-compress").addClass("fa-expand");
  }
});

// AngulaJS App Init
var app = angular.module("videoCallApp", []);
app.controller("vcAppCtrl", function($scope, $http) {
  var self = this;
  self.onlineUsers = [];

  socket.on("new user", function(user) {
    if (user.username == self.username) {
      $http.get("/onlineUsers").then(res => {
        self.onlineUsers = res.data;
      });
    } else {
      self.onlineUsers.push(user);
    }
    $scope.$apply();
  });

  socket.on("user logout", function(user) {
    self.onlineUsers.splice(user, 1);
    $scope.$apply();
  });

  self.loginUser = function() {
    socket.emit("login", self.username);

    $("#formDiv").hide();
    $("#dashboard").show();
    menuBtn.show();
  };

  // Function to check username availability
  self.usernameAvb = function() {
    self.username = angular.lowercase(self.username);
    if (self.username.length >= 5) {
      $http.get("/usernameCheck/" + self.username).then(res => {
        self.userAvb = res.data.result;
      });
    }
  };
});

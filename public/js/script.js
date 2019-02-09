let showOnlineUsers = false;
const videoCallEl = document.querySelector("#video");
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

var socket = io();
console.log(socket);
var peerConn,
  onlineUsers = [],
  username,
  caller;
function createOffer(callee) {
  peerConn = new RTCPeerConnection();
  peerConn.onicecandidate = onIce;
  peerConn.onaddstream = onAddStream;
  navigator.mediaDevices
    .getUserMedia({ audio: true, video: { height: 480, width: 840 } })
    .then(stream => {
      peerConn.addStream((window.myVideo.srcObject = stream));
      return peerConn.createOffer();
    })
    .then(offer => peerConn.setLocalDescription(offer))
    .then(() => socket.emit("call", callee, peerConn.localDescription))
    .catch(e => console.log(e));
  caller = callee;
}

socket.on("call", (callee, caller, sdp) => {
  if (callee == username) {
    createAnswer(sdp, caller);
  }
});
function createAnswer(sdp, caller) {
  peerConn = new RTCPeerConnection();
  peerConn.onicecandidate = onIce;
  peerConn.onaddstream = onAddStream;
  window.caller = caller;
  peerConn
    .setRemoteDescription(sdp)
    .then(() =>
      navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { height: 480, width: 840 }
      })
    )
    .then(stream => {
      peerConn.addStream((window.myVideo.srcObject = stream));
      return peerConn.createAnswer();
    })
    .then(answer => peerConn.setLocalDescription(answer))
    .then(() => socket.emit("answer", caller, peerConn.localDescription))
    .catch(e => console.log(e));
  console.log(peerConn.localDescription);
  console.log(peerConn.remoteDescription);
}

function onIce(event) {
  if (event.candidate) {
    socket.emit("ice", caller, event.candidate);
    console.log("sent ice");
  } else {
    console.log("Sent all ice");
  }
}

function onAddStream(event) {
  document.getElementById("friendsVideo").srcObject = event.stream;
  console.log("remote stream added");
}

socket.on("answer", (callee, caller, sdp) => {
  if (caller == username) setRemoteDes(sdp);
});
function setRemoteDes(sdp) {
  peerConn.setRemoteDescription(sdp);
  console.log(peerConn.localDescription);
  console.log(peerConn.remoteDescription);
}

function addIce(caller, callee, ice) {
  peerConn.addIceCandidate(new RTCIceCandidate(ice));
  console.log("ice added");
}

socket.on("ice", addIce);

$("#hangUpBtn").click(function() {
  closeAll();
  socket.emit("end call", caller);
});

socket.on("end call", endCall);
function endCall(caller, callee) {
  if (caller == window.caller) {
    closeAll();
  }
}

function closeAll() {
  peerConn.close();
  peerConn = null;
  document.getElementById("friendsVideo").srcObject = null;
  window.myVideo.srcObject.getTracks().forEach(track => track.stop());
  window.myVideo.srcObject = null;
}

function checkUserAvb() {
  var inp = $("#username").val();
  if (inp.length < 5) {
    $("#loginBtn").attr("disabled", "true");
    $("#userAvb").hide();
    return;
  }
  $.get(
    "/usernameCheck/" + inp,
    {},
    res => {
      if (res.result) {
        $("#userAvb")
          .removeClass("alert alert-danger")
          .addClass("alert alert-success")
          .show();
        $("#userAvb").html(
          "<strong>Username available!</strong> You may now login."
        );
        $("#loginBtn").removeAttr("disabled");
      } else {
        $("#userAvb")
          .removeClass("alert alert-success")
          .addClass("alert alert-danger");
        $("#userAvb").html(
          "<strong>Username not available!</strong> Please try again."
        );
        $("#loginBtn").attr("disabled", "true");
      }
    },
    "json"
  );
}

$("#loginBtn").click(login);
function login(e) {
  $("#formDiv").hide();
  $.get(
    "/onlineUsers",
    {},
    res => {
      if (res.length == 0) return;
      onlineUsers = res;
      updateUserList();
    },
    "json"
  );
  console.log(onlineUsers);
  $("#dashboard").show();
  username = $("#username").val();
  $("#username2").text(username);
  socket.emit("login", username);
  if ($(window).innerHeight() < 768) {
    menuBtn.show();
  }
  e.preventDefault();
}

socket.on("new user", addUser);
function addUser(user) {
  onlineUsers.push(user);
  console.log("new user");
  if (username == user.username || username == undefined) return;
  var list = "";
  list +=
    '<li id="' +
    user.username +
    '" class="list-group-item animated fadeInUp" style="justify-items: center">' +
    '<strong class="pt-3" style="font-size: 1.2rem">' +
    user.username +
    "</strong>";
  if (user.inCall) {
    list +=
      '<span class="badge badge-pill badge-danger animated fadeInRight float-right">In Call</span>' +
      '<button style="display:none" class="btn btn-primary btn-sm float-right rounded-circle" onclick="createOffer(`' +
      user.username +
      '`)"><span class="fas fa-video p-1 py-2" style="font-size: .8rem"></span>' +
      "</button></li>";
  } else {
    list +=
      '<span class="badge badge-pill badge-danger animated fadeInRight float-right" style="display:none">In Call</span>' +
      '<button class="btn btn-primary btn-sm float-right rounded-circle" onclick="createOffer(`' +
      user.username +
      '`)"><span class="fas fa-video p-1 py-2" style="font-size: .8rem"></span>' +
      "</button></li>";
  }
  $("#usersList").append(list);
}

function updateUserList() {
  console.log("update");
  for (var i = 0; i < onlineUsers.length; i++) {
    if (onlineUsers[i].username == username) continue;
    var list = "";
    console.log(onlineUsers[i]);
    list +=
      '<li id="' +
      onlineUsers[i].username +
      '" class="list-group-item animated fadeInUp" style="justify-items: center">' +
      '<strong class="pt-3" style="font-size: 1.2rem">' +
      onlineUsers[i].username +
      "</strong>";
    if (!onlineUsers[i].inCall) {
      list +=
        '<span class="badge badge-pill badge-danger animated fadeInRight float-right" style="display:none">In Call</span>' +
        '<button class="btn btn-primary btn-sm float-right rounded-circle" onclick="createOffer(`' +
        onlineUsers[i].username +
        '`)"><span class="fas fa-video p-1 py-2" style="font-size: .8rem"></span>' +
        "</button></li>";
    } else {
      list +=
        '<span class="badge badge-pill badge-danger animated fadeInRight float-right">In Call</span>' +
        '<button style="display:none" class="btn btn-primary btn-sm float-right rounded-circle" onclick="createOffer(`' +
        onlineUsers[i].username +
        '`)"><span class="fas fa-video p-1 py-2" style="font-size: .8rem"></span>' +
        "</button></li>";
    }
    $("#usersList").append(list);
  }
}

socket.on("user logout", logout);
function logout(i) {
  user = onlineUsers.splice(i, 1)[0];
  $("#" + user.username).remove();
}

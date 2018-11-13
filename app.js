const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const path = require("path");

var onlineUsers = [];

io.on("connection", socket => {
  console.log(
    "New user connected\n",
    `${socket.conn.server.clientsCount} connected users`
  );
  socket.on("login", username => {
    socket.username = username;
    socket.index = onlineUsers.length;
    var newuser = { username: username, inCall: false };
    onlineUsers[socket.index] = newuser;
    console.log(`New user ${username} logged in`);
    io.emit("new user", newuser);
  });
  socket.on("call", (callee, sdp) => {
    console.log(`${socket.username} calling ${callee}  ${sdp}`);
    onlineUsers.forEach((user, i) => {
      if (user.username == callee || user.username == socket.username) {
        onlineUsers[i].inCall = true;
      }
    });
    socket.broadcast.emit(`call`, callee, socket.username, sdp);
  });
  socket.on("call reject", caller => {
    socket.broadcast.emit("call reject", socket.username, caller);
  });
  socket.on("answer", (caller, sdp) => {
    console.log(`${socket.username} answered ${caller}  ${sdp}`);
    socket.broadcast.emit("answer", socket.username, caller, sdp);
  });
  socket.on("ice", (caller, ice) => {
    socket.broadcast.emit("ice", socket.username, caller, ice);
    console.log("ice recived and sent");
  });
  socket.on("end call", caller => {
    socket.broadcast.emit("end call", socket.username, caller);
  });
  socket.on("disconnect", () => {
    if (socket.username) {
      io.emit("user logout", socket.index);
      onlineUsers.splice(socket.index, 1);
    }
    console.log(
      `User ${socket.username} disconnected\n`,
      `${socket.conn.server.clientsCount} connected users`
    );
  });
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.get("/usernameCheck/:username", function(req, res) {
  if (onlineUsers.length > 0) {
    for (var i = 0; i < onlineUsers.length; i++) {
      if (req.params.username == onlineUsers[i].username) {
        res.send({ result: false });
        return;
      }
    }
  }
  res.send({ result: true });
});

app.get("/onlineUsers", (req, res) => {
  res.json(onlineUsers);
});

app.get("*", function(req, res) {
  res.redirect("/");
});

const port = process.env.PORT || 8080;

http.listen(port, function() {
  console.log("listening on port: ", port);
});

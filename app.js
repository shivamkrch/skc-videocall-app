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
  socket.on("disconnect", () => {
    if (socket.username != undefined) {
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

const port = process.env.port || 8080;

http.listen(port, function() {
  console.log("listening on port: ", port);
});

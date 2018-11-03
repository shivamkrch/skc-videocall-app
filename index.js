const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const path = require("path");

io.on("connection", socket => {
  console.log(
    "New user connected\n",
    `${socket.conn.server.clientsCount} connected users`
  );
  socket.on("disconnect", () => {
    console.log(
      "A user disconnected\n",
      `${socket.conn.server.clientsCount} connected users`
    );
  });
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.get("*", function(req, res) {
  res.redirect("/");
});

const port = process.env.port || 8080;

http.listen(port, function() {
  console.log("listening on port: ", port);
});

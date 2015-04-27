var express = require("express"),
    http = require("http"),
    // import the mongoose library
    mongoose = require("mongoose"),
    app = express(),
    server = http.createServer(app),
    io = require("socket.io")(server);

app.use(express.static(__dirname + "/client"));
app.use(express.bodyParser());

// connect to the amazeriffic data store in mongo
mongoose.connect('mongodb://localhost/amazeriffic');

// This is our mongoose model for todos
var ToDoSchema = mongoose.Schema({
    description: String,
    tags: [String]
});

var ToDo = mongoose.model("ToDo", ToDoSchema);

server.listen(3000, function() {
    console.log("Server listening on http://localhost:3000");
});

io.on("connection", function(socket) {
    console.log("a user has connected");

    socket.on("disconnect", function() {
        console.log('user disconnected');
    });

    socket.on("add todo", function(todo) {
        console.log(todo);
        //When a todo is added, emit to all users
        io.emit("add todo", todo);

        //Add new todo to database
        var newToDo = new ToDo({
            "description": todo.description,
            "tags": todo.tags
        });
        newToDo.save(function(err, result) {
            if (err !== null) {
                // the element did not get saved!
                console.log(err);
                res.send("ERROR");
            } else {
                // our client expects *all* of the todo items to be returned, so we'll do
                // an additional request to maintain compatibility
                ToDo.find({}, function(err, result) {
                    if (err !== null) {
                        // the element did not get saved!
                        res.send("ERROR");
                    }
                    socket.emit("return todos", result);
                });
            }
        });
    });
});

app.get("/todos.json", function(req, res) {
    ToDo.find({}, function(err, toDos) {
        res.json(toDos);
    });
});

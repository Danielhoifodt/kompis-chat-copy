const express = require("express");
const socketio = require("socket.io");
const expressLayouts = require("express-ejs-layouts");
const mongoose = require("mongoose");
const flash = require('connect-flash');
const session = require("express-session");
const passport = require('passport');
const formatMessage = require("./utils/messages");


var app = express();

//Passport config
require('./config/passport')(passport);
//EJS
app.use(expressLayouts);
app.set("view engine", "ejs");

//Express session
app.use(session({
	secret: "secret",
		resave: true,
		saveUninitialized: true
}))

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use((req, res, next) => {
	res.locals.success_msg = req.flash("success_msg");
	res.locals.error_msg = req.flash("error_msg");
	res.locals.error = req.flash('error');
	next();
})

//Bodyparser

app.use(express.urlencoded({extended: false}));

const PORT = process.env.PORT || 5000;

const server = require('http').createServer(app);
server.listen(PORT, function(){
	console.log(`Server running on port ${PORT}`);
});


//Socet.io setup
const io = socketio(server);
var users = [];
io.on('connection', socket => {
	console.log("New WS connection");

    socket.on('adduser', function(user) {
		socket.user = user;
		users.push(user);
		if(users.length > 10){
			socket.emit("message", formatMessage("Chat-Bot", "Chatten er full!"));
			socket.disconnect();
		}else{
		socket.emit("message", formatMessage("Chat-Bot", "Velkommen til chat!"));
		io.emit("users", users);
		}
	});

	socket.on("img", function(user, img){
		io.emit("img_back", user, img);
	})

    socket.broadcast.emit("message", formatMessage("Chat-Bot", "En bruker har koblet til."));

    socket.on("disconnect", () => {
        
		const index = users.indexOf(socket.user);
		if (index > -1) {
  		users.splice(index, 1);
}
		io.sockets.emit("update", users);
        
          
        io.emit("message", formatMessage("Chat-Bot", "En bruker har koblet av."));

	})
	
    socket.on("chatMessage", (username, msg) => {
        io.emit("message", formatMessage(username, msg));
	})
	
	
})

const db = require("./config/keys").MongoURI;

mongoose.connect(db, {useNewUrlParser:true, useUnifiedTopology: true })
.then(()=> console.log("Mongodb connected"))
.catch(err => console.log(err));

app.use(express.urlencoded({extended:false}));

app.use('/', require("./routes/index"));
app.use('/users', require("./routes/users"));


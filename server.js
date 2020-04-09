const express = require("express");
const socketio = require("socket.io");
const expressLayouts = require("express-ejs-layouts");
const flash = require('connect-flash');
const session = require("express-session");
const passport = require('passport');
const formatMessage = require("./utils/messages");
const methodOverride = require('method-override');
const bodyParser = require("body-parser");
const favicon = require('serve-favicon');
const path = require('path');
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require("./utils/users");


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
app.use(methodOverride('_method'));
app.use(favicon(path.join(__dirname, 'public', 'favicon.jpg')));
app.use(express.static('public'));

app.use(flash());

app.use((req, res, next) => {
	res.locals.success_msg = req.flash("success_msg");
	res.locals.error_msg = req.flash("error_msg");
	res.locals.error = req.flash('error');
	next();
})

//Bodyparser
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


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
	socket.on("joinRoom", ({username, room}) => {
		const user = userJoin(socket.id, username, room);

		socket.join(user.room);
		
		socket.emit("message", formatMessage("Chat-Bot", "Velkommen til chat!"));
		
		socket.broadcast.to(user.room).emit("message", formatMessage("Chat-Bot", `${user.username} har koblet til.`));

		io.to(user.room).emit("roomUsers", {
			room: user.room,
			users: getRoomUsers(user.room)
		});

		socket.on("base64 file", (msg) =>{
			io.to(user.room).sockets.emit("base64 file back", {

			})
		})
		
	



    

    socket.on("disconnect", () => {
		const user = userLeave(socket.id);
		if(user){
			io.to(user.room).emit("message", formatMessage("Chat-Bot", `${user.username} har koblet av.`));
			
			io.to(user.room).emit("roomUsers", {
				room: user.room,
				users: getRoomUsers(user.room)
			})
		}
	});


	
    socket.on("chatMessage", (msg) => {
		const user = getCurrentUser(socket.id);
        io.to(user.room).emit("message", formatMessage(user.username, msg));
	})
});
	
})


app.use(express.urlencoded({extended:false}));

app.use('/', require("./routes/index"));
app.use('/users', require("./routes/users"));


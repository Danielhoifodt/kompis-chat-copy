const mongoose = require("mongoose");
const db = require("../config/keys").MongoURI;

mongoose.connect(db, {useNewUrlParser:true, useUnifiedTopology: true })
.then(()=> console.log("Mongodb connected"))
.catch(err => console.log(err));

const UserSchema = mongoose.Schema({
    username:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    date:{
        type: Date,
        default: Date.now
    }
});

const Users = mongoose.model('dh', UserSchema);

module.exports = Users;
const mongoose = require("mongoose");
const db = require("../config/keys").MongoURI;

mongoose.connect(db, {useNewUrlParser:true, useUnifiedTopology: true })
.then(()=> console.log("Mongodb connected2"))
.catch(err => console.log(err));

const FilesSchema = mongoose.Schema({
    file:{
        type: String,
        required: true
    },
    date:{
        type: Date,
        default: Date.now
    },
    
});

const Files = mongoose.model('files', FilesSchema);

module.exports = Files;
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const crypto = require("crypto");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");
const multer = require("multer");
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require("gridfs-stream");
const mongoURI = require("../config/keys").MongoURI;



// Welcome
router.get("/", (req, res) => res.render("welcome"));
//Dashboard
/* router.get("/dashboard", ensureAuthenticated, (req, res) => 
res.render("dashboard", {
    username : req.user.username
})); */



const conn = mongoose.createConnection(mongoURI);

let gfs;

Grid.mongo = mongoose.mongo;

conn.once("open", () =>{
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection("uploads");
});
const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
  });
let upload = multer({
    storage: storage
})
router.post("/dashboard", upload.single("file"), (req, res) =>{  
  //res.json({file:req.file})
  res.redirect("/dashboard");
})
router.delete('/files/:id', (req, res) => {
  gfs.remove({ _id: req.params.id, root: 'uploads' }, (err, gridStore) => {
    if (err) {
      return res.status(404).json({ err: err });
    }

    res.redirect('/dashboard');
  });
});
/* router.get("/dashboard", ensureAuthenticated, (req, res) => 
res.render("dashboard", {
    username : req.user.username
})); */

router.get('/dashboard', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    if (!files || files.length === 0) {
      res.render('dashboard', { files: false, username: req.user.username });
    } else {
      files.map(file => {
        if (
          file.contentType === 'image/jpeg' ||
          file.contentType === 'image/png'  ||
          file.contentType === 'image/gif'
        ) {
          file.isImage = true;
        } else {
          file.isImage = false;
        }
      });
      res.render("dashboard", {files: files, username:req.user.username});
    }
  });
});


// @route GET /files
// @desc  Display all files in JSON
router.get('/files', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    // Check if files
    if (!files || files.length === 0) {
      return res.status(404).json({
        err: 'No files exist'
      });
    }

    // Files exist
    return res.json(files);
  });
});

// @route GET /files/:filename
// @desc  Display single file object
router.get('/files/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }
    // File exists
    return res.json(file);
  });
});

// @route GET /image/:filename
// @desc Display Image
router.get('/image/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }

    // Check if image
    if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
      // Read output to browser
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      res.status(404).json({
        err: 'Not an image'
      });
    }
  });
});

module.exports = router;
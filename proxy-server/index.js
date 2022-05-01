// THESE ARE NODE APIs WE WISH TO USE
const express = require('express')  // Web Server
const cors = require('cors')  // Cross origin resource sharing, Security policy
const dotenv = require('dotenv')
const cookieParser = require('cookie-parser')
const multer  = require('multer'); // image upload
const path = require('path');

// CREATE OUR SERVER
dotenv.config();
const PORT = process.env.PORT || 4000;
const app = express();



// SETUP FILE UPLOADER
let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/var/www/html/media/access')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + Date.now() + path.extname(file.originalname))
  }
})
upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname).toLowerCase();
    if(ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
        return callback(null, false)
    }
    callback(null, true)
  },
  limits:{
      fileSize: 1024 * 1024
  }
});
app.use(express.static(__dirname + '/public'));
app.use('/uploads', express.static('uploads'));

app.use(cookieParser());

// SETUP OUR OWN ROUTERS AS MIDDLEWARE
const appRouter = require('./routes/app-router');
app.use('/', appRouter)

// THESE NEED TO BE AFTER (app.use('/', appRouter)) IN ORDER FOR PROXY TO WORK DUE TO PARSING. ------- BEGIN ----
app.use(express.urlencoded({ extended: true, limit: '1mb'}))
app.use(express.json({limit: '1mb'}));
app.use(cors({
  origin: ["http://localhost:3000"],
  credentials: true
}))
// THESE NEED TO BE AFTER ROUTER IN ORDER FOR PROXY TO WORK DUE TO PARSING. ------- END ----


// INITIALIZE OUR DATABASE OBJECT
//const db = require('./db')
//db.on('error', console.error.bind(console, 'MongoDB connection error:'))

// PUT THE SERVER IN LISTENING MODE

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))



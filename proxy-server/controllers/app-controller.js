//const request = require('request');

const Media = require("../models/media-model");
const path = require('path');

//  (file)     { mediaid }
// Save uploaded file and its mime type and return its ID.
mediaUpload = async (req,res) => {
  res.append('X-CSE356', '61fa16dc73ba724f297dba00') // For class
  console.log("Uploading file:")
  //console.log(req.files)
  /*
  [
  {
    fieldname: '',
    originalname: 'blue.PNG',
    encoding: '7bit',
    mimetype: 'image/png',
    destination: './uploads',
    filename: 'blue.PNG',
    path: 'uploads\\blue.PNG',
    size: 957973
  }
  ]
  */
  if (!req.files[0]) {
    return res.status(200).json({
      error:true,
      message:"Only images allowed"
    })
  }

  let { filename, mimetype, path } = req.files[0];
  // Save media data to mongo
  let newMedia = new Media({
    filename, mimetype, path
  });
  let savedMedia = await newMedia.save();
  return res.status(200).json({
    mediaid: savedMedia.filename
  });
} 

//  Return the contents of a previously uploaded media file (GET request).
mediaAccess = async (req,res) => {
  res.append('X-CSE356', '61fa16dc73ba724f297dba00') // For class
  const mediaid = req.params.mediaid;
  console.log("Accessing file:")
  
  // Get image data
  let media = await Media.findOne({ _id: mediaid });
  if (!media) {
    return res.status(200).json({
      error: true,
      message: "Invalid id"
    });
  }
  console.log(media);
  res.contentType(media.mimetype);
  res.sendFile(path.join(__dirname, '..', 'uploads', media.filename));
} 

module.exports = {
    mediaUpload,
    mediaAccess
}

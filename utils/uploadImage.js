const multer = require("multer")
const path = require("path")

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  },
  filename: function (req, file, cb) {
    const datetimestamp = Date.now()
    cb(null, `${file.fieldname}-${req.user.npp}.${file.originalname.split('.')[file.originalname.split('.').length - 1]}`)
  }
})

const uploadImg = multer({
  storage: storage,
  fileFilter: function (req, file, callback) {
    const ext = path.extname(file.originalname)
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
      return callback(new Error('Only images are allowed'))
    }
    callback(null, true)
  }
}).single('image')


module.exports = uploadImg
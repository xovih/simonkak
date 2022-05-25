require("dotenv").config()
const jwt = require("jsonwebtoken")

function verify(req, res, next) {
  const authHeader = req.headers.token
  if (authHeader) {
    const token = authHeader.split(" ")[1]

    jwt.verify(token, process.env.APP_SKEY, (err, user) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: "Token Tidak Valid !"
        })
      }

      req.user = user
      next()
    })
  } else {
    return res.status(401).json({
      success: false,
      message: "Ijin Ditolak !",
    })
  }
}

module.exports = verify

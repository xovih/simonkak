require("dotenv").config()
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const db = require("../utils/connpg")

const login = async (req, res) => {
  try {
    const { npp } = req.body

    if (req.body.password) {
      const getUser = await db.query("SELECT * FROM v_login WHERE npp = $1", [npp])
      if (getUser.rowCount == 0) {
        return res.status(401).json({
          success: false,
          message: "User tidak ditemukan !",
        })
      }

      const user = getUser.rows[0]
      const avatar = `${req.protocol}://${req.hostname}:${process.env.APP_PORT}/${user.photo}`

      const validated = await bcrypt.compare(req.body.password, user.password)
      if (!validated) {
        return res.status(401).json({
          success: false,
          message: "Password Salah !",
        })
      }

      const { password, photo, ...data } = user // exclude
      const accessToken = jwt.sign(
        {
          id: user.user_id,
          npp: user.npp,
          fullname: user.fullname
        },
        process.env.APP_SKEY,
        { expiresIn: "1d" }
      )

      return res.status(200).json({
        success: true,
        message: "Login Sukses !",
        data: { ...data, avatar, accessToken }, // include
      })
    } else {
      return res.status(400).json({
        success: false,
        message: "Password Wajib Diisi !"
      })
    }

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      detail: err
    })
  }
}

module.exports = login
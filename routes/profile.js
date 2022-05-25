const router = require("express").Router()
const verify = require("../middlewares/verifyToken")
const {
  getProfile,
  updateProfile,
  changePassword,
  changeAvatar
} = require("../controllers/profile")

router.use(verify)

router.get("/:id", getProfile)
router.put("/update/:id", updateProfile)
router.put("/changepassword/:id", changePassword)
router.put("/changeavatar/:id", changeAvatar)

module.exports = router
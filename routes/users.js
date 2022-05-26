const router = require("express").Router()
const verify = require("../middlewares/verifyToken")
const {
	addUser,
	listUsers,
	getUser,
	updateUser,
	delUser,
	resetPassword,
	aktivasiUser,
} = require("../controllers/users")

router.use(verify)

router.post("/", addUser)
router.get("/", listUsers)
router.get("/:id", getUser)
router.put("/update/:id", updateUser)
router.put("/passwordreset/:id", resetPassword)
router.delete("/:id", delUser)
router.put("/:id", aktivasiUser)

module.exports = router

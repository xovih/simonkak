const router = require("express").Router()
const verify = require("../middlewares/verifyToken")
const {
	addOp,
	listOps,
	getOp,
	changeOp,
	delOP,
} = require("../controllers/operators")

router.use(verify)

router.post("/", addOp)
router.get("/", listOps)
router.get("/:id", getOp)
router.put("/:id", changeOp)
router.delete("/:id", delOP)

module.exports = router

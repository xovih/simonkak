const router = require("express").Router()
const verify = require("../middlewares/verifyToken")
const {
	addMachine,
	delMachines,
	listMachines,
	getMachine,
	updateMachine,
} = require("../controllers/machines")

router.use(verify)

router.post("/", addMachine)
router.delete("/:id", delMachines)
router.get("/", listMachines)
router.get("/:id", getMachine)
router.put("/:id", updateMachine)

module.exports = router

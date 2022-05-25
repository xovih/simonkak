const router = require("express").Router()
const verify = require("../middlewares/verifyToken")
const {
  addWC, listWC, getWC, changeWC, delWC
} = require("../controllers/workCenters")

router.use(verify)

router.post("/", addWC)
router.get("/", listWC)
router.get("/:id", getWC)
router.put("/:id", changeWC)
router.delete("/:id", delWC)

module.exports = router
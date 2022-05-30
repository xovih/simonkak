const router = require("express").Router()
const verify = require("../middlewares/verifyToken")
const {
  addWO,
  delWO,
  updateWO,
  getWO,
  listWO
} = require("../controllers/workorders")

router.use(verify)

router.get("/", listWO)
router.get("/:id", getWO)
router.post("/", addWO)
router.put("/:id", updateWO)
router.delete("/:id", delWO)

module.exports = router
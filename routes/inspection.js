const router = require("express").Router()
const verify = require("../middlewares/verifyToken")
const {
  addInspect,
  delInspect,
  listInspect
} = require("../controllers/inspection")

router.use(verify)

router.get("/", listInspect)
router.post("/", addInspect)
router.delete("/:id", delInspect)

module.exports = router
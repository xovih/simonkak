const router = require("express").Router()
const verify = require("../middlewares/verifyToken")
const {
  add,
  del,
  list,
  get
} = require("../controllers/warehousing")

router.use(verify)

router.get("/", list)
router.get("/:id", get)
router.post("/", add)
router.delete("/:id", del)

module.exports = router
const router = require("express").Router()
const verify = require("../middlewares/verifyToken")
const {
  add,
  del,
  list,
  get,
  set,
  reject
} = require("../controllers/expenditures")

router.use(verify)

router.get("/", list)
router.get("/:id", get)
router.put("/accept/:id", set)
router.put("/reject/:id", reject)
router.post("/", add)
router.delete("/:id", del)

module.exports = router
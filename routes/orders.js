const router = require("express").Router()
const verify = require("../middlewares/verifyToken")
const {
  addOrder, importOrders, listOrders, getDetailOrder, delOrder
} = require("../controllers/orders")

router.use(verify)

router.post("/", addOrder)
router.post("/import", importOrders)
router.get("/", listOrders)
router.get("/:id", getDetailOrder)
router.delete("/:id", delOrder)

module.exports = router
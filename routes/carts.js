const router = require("express").Router()
const verify = require("../middlewares/verifyToken")
const {
	addToCart,
	removeItem,
	eraseAll,
	updQty,
	getUserCart,
} = require("../controllers/carts")

router.use(verify)

router.post("/", addToCart)
router.delete("/item/:id", removeItem)
router.delete("/all", eraseAll)
router.put("/", updQty)
router.get("/", getUserCart)

module.exports = router

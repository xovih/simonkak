const router = require("express").Router()
const verify = require("../middlewares/verifyToken")
const {
  moving, delMove, getMove, listMoves
} = require("../controllers/moveOrders")
router.use(verify)

router.get("/:id", getMove)
router.get("/", listMoves)
router.post("/", moving)
router.delete("/:id", delMove)

module.exports = router
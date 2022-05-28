const router = require("express").Router()
const verify = require("../middlewares/verifyToken")
const { inputKK, listKK, delKK } = require("../controllers/timeTickets")

router.use(verify)

router.post("/", inputKK)
router.get("/:filter", listKK)
router.delete("/:id", delKK)

module.exports = router

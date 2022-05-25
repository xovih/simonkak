const router = require("express").Router()
const verify = require("../middlewares/verifyToken")
const {
  addActor, delActor, listActors, getActor, renameActor, addMenu, delMenu
} = require("../controllers/actors")

router.use(verify)

router.post("/", addActor)
router.delete("/:id", delActor)
router.get("/", listActors)
router.get("/:id", getActor)
router.put("/:id", renameActor)
router.post("/menu/:id", addMenu)
router.delete("/menu/:id", delMenu)

module.exports = router
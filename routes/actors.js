const router = require("express").Router()
const verify = require("../middlewares/verifyToken")
const {
  addActor, delActor, listActors, getActor, renameActor, addMenu, delMenu, actorMenus
} = require("../controllers/actors")

router.use(verify)

router.post("/", addActor)
router.delete("/:id", delActor)
router.get("/all", listActors)
router.get("/single/:id", getActor)
router.get("/menus/:type/:cat/:id/:parent", actorMenus)
router.put("/:id", renameActor)
router.post("/menu/:id", addMenu)
router.delete("/menu/:id", delMenu)

module.exports = router
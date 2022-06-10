const router = require("express").Router()
const verify = require("../middlewares/verifyToken")
const {
  addActor,
  delActor,
  listActors,
  getActor,
  renameActor,
  addMenu,
  delMenu,
  actorMenus,
  menusCount,
  usersCount,
  actorUsers,
  copyActor
} = require("../controllers/actors")

router.use(verify)

router.post("/", addActor)
router.post("/copy/:actorid", copyActor)
router.delete("/:id", delActor)
router.get("/", listActors)
router.get("/detail/:id", getActor)
router.get("/menus/:type/:cat/:id/:parent", actorMenus)
router.get("/users/:actorid", actorUsers)
router.get("/menuscount/:actorid", menusCount)
router.get("/userscount/:actorid", usersCount)
router.put("/:id", renameActor)
router.post("/menu/:id", addMenu)
router.delete("/menu/:id", delMenu)

module.exports = router
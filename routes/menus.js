const router = require("express").Router()
const verify = require("../middlewares/verifyToken")
const {
  addMenu, listMenu, getMenu, changeMenu, delMenu, getChildCount, getParentName
} = require("../controllers/menus")

router.use(verify)

router.post("/", addMenu)
router.get("/type/:types", listMenu)
router.get("/:id/childcount", getChildCount)
router.get("/:id/parentname", getParentName)
router.get("/detail/:id", getMenu)
router.put("/:id", changeMenu)
router.delete("/:id", delMenu)

module.exports = router
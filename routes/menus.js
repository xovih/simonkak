const router = require("express").Router()
const verify = require("../middlewares/verifyToken")
const {
  addMenu, listMenu, getMenu, changeMenu, delMenu
} = require("../controllers/menus")

router.use(verify)

router.post("/", addMenu)
router.get("/", listMenu)
router.get("/:id", getMenu)
router.put("/:id", changeMenu)
router.delete("/:id", delMenu)

module.exports = router
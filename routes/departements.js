const router = require("express").Router()
const verify = require("../middlewares/verifyToken")
const {
  listDept,
  getDept,
  updateDepartement,
  removeDepartement,
  insertDepartement
} = require("../controllers/departements")

router.use(verify)

router.post("/", insertDepartement)
router.get("/", listDept)
router.get("/:id", getDept)
router.put("/:id", updateDepartement)
router.delete("/:id", removeDepartement)

module.exports = router
const db = require("../utils/connpg")

const listDept = async (req, res) => {
  try {
    let { search, page, limit } = req.query

    limit = limit ? parseInt(limit) : 10
    let offset = page ? (parseInt(page) - 1) * limit : 0

    if (search) {
      const total = await db.query(`SELECT COUNT(*) AS total FROM departements WHERE dept_name ILIKE '%${search}%'`)

      const dept = await db.query(
        `
        SELECT * FROM departements 
        WHERE dept_name ILIKE '%${search}%'
        ORDER BY dept_id DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      )

      return res.status(200).json({
        success: true,
        message: "Data Departement Ditemukan !",
        data: dept.rows,
        totalData: parseInt(total.rows[0].total),
        page: page ? parseInt(page) : 1,
        totalPage: Math.ceil(parseInt(total.rows[0].total) / limit)
      })
    }

    const total = await db.query("SELECT COUNT(*) AS total FROM departements")

    const dept = await db.query(
      `
        SELECT * FROM departements 
        ORDER BY dept_id DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    )

    return res.status(200).json({
      success: true,
      message: "Data Departement Ditemukan !",
      data: dept.rows,
      totalData: parseInt(total.rows[0].total),
      page: page ? parseInt(page) : 1,
      totalPage: Math.ceil(parseInt(total.rows[0].total) / limit)
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      detail: err
    })
  }
}

const getDept = async (req, res) => {
  try {
    const deptID = req.params.id

    const dept = await db.query(
      `
          SELECT * FROM departements WHERE dept_id = ${deptID}
        `
    )

    if (dept.rowCount == 0) {
      return res.status(400).json({
        success: false,
        message: "Departemen Tidak Ditemukan !",
      })
    }

    return res.status(200).json({
      success: true,
      message: "Data Departemen Ditemukan !",
      data: dept.rows[0]
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      detail: err
    })
  }
}

const insertDepartement = async (req, res) => {
  try {
    const { deptName } = req.body

    const cekDept = await db.query(
      `SELECT dept_name FROM departements WHERE dept_name = '${deptName}'`
    )

    if (cekDept.rowCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Departemen Sudah Terdaftar, Silahkan Pilih Nama Lain !",
      })
    }

    const insertDept = await db.query(
      `
        INSERT INTO departements(dept_name) VALUES ('${deptName}') RETURNING dept_name AS dept
      `
    )

    return res.status(200).json({
      success: true,
      message: `Departement ${insertDept.rows[0].dept} Berhasil Ditambahkan !`
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      detail: err
    })
  }
}

const updateDepartement = async (req, res) => {
  try {
    const deptID = req.params.id
    const { deptName } = req.body

    await db.query(
      `
        UPDATE departements SET dept_name = '${deptName}' WHERE dept_id = ${deptID}
      `
    )

    return res.status(200).json({
      success: true,
      message: `Berhasil Mengubah Dept Terpilih menjadi Dept ${deptName} !`
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      detail: err
    })
  }
}

const removeDepartement = async (req, res) => {
  try {
    const deptID = req.params.id

    const delDept = await db.query(
      `
        DELETE FROM departements WHERE dept_id = ${deptID} RETURNING dept_name AS dept
      `
    )

    return res.status(200).json({
      success: true,
      message: `Departement ${delDept.rows[0].dept} Berhasil Dihapus !`
    })
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: "Depertemen Terpilih Gagal Dihapus !",
      detail: err
    })
  }
}

module.exports = {
  listDept,
  getDept,
  insertDepartement,
  updateDepartement,
  removeDepartement
}
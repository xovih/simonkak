const db = require("../utils/connpg")

const addWC = async (req, res) => {
  try {
    const { name, orderNo, deptID } = req.body

    if (!name || !orderNo || !deptID) {
      return res.status(400).json({
        success: false,
        message: "Nama, Urutan, atau Departement Wajib Diisi !"
      })
    }

    const cekName = await db.query(
      `SELECT workcen_name FROM work_center WHERE workcen_name = '${name}'`
    )

    if (cekName.rowCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Seksi / Bagian ${name} Sudah Terdaftar, Silahkan Pilih Nama Lain !`,
      })
    }

    await db.query(
      `
        INSERT INTO work_center(workcen_name, priority_no, dept_id) 
        VALUES ($1, $2, $3)
      `,
      [name, orderNo, deptID]
    )

    return res.status(200).json({
      success: true,
      message: `Work Center / Bagian ${name} Berhasil Ditambahkan !`
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Gagal Menambahkan Work Center / Bagian",
      detail: err
    })
  }
}

const listWC = async (req, res) => {
  try {
    let { search, page, limit } = req.query

    limit = limit ? parseInt(limit) : 10
    let offset = page ? (parseInt(page) - 1) * limit : 0

    if (search) {
      const total = await db.query(`SELECT COUNT(*) AS total FROM work_center WHERE workcen_name ILIKE '%${search}%'`)

      const wc = await db.query(
        `
        SELECT * FROM work_center 
        WHERE workcen_name ILIKE '%${search}%'
        ORDER BY workcen_id DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      )

      return res.status(200).json({
        success: true,
        message: "Data Work Center / Bagian Ditemukan !",
        data: wc.rows,
        totalData: parseInt(total.rows[0].total),
        page: page ? parseInt(page) : 1,
        totalPage: Math.ceil(parseInt(total.rows[0].total) / limit)
      })
    }

    const total = await db.query("SELECT COUNT(*) AS total FROM work_center")

    const wc = await db.query(
      `
        SELECT * FROM work_center 
        ORDER BY workcen_id DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    )

    return res.status(200).json({
      success: true,
      message: "Data Work Center / Bagian Ditemukan !",
      data: wc.rows,
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

const getWC = async (req, res) => {
  try {
    const workcenID = req.params.id

    const workcen = await db.query(
      `
          SELECT * FROM work_center WHERE workcen_id = ${workcenID}
        `
    )

    if (workcen.rowCount == 0) {
      return res.status(400).json({
        success: false,
        message: "Work Center / Bagian Tidak Ditemukan !",
      })
    }

    return res.status(200).json({
      success: true,
      message: "Data Work Center / Bagian Ditemukan !",
      data: workcen.rows[0]
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      detail: err
    })
  }
}

const changeWC = async (req, res) => {
  try {
    const workcenID = req.params.id
    const { name, orderNo, deptID } = req.body

    if (!name || !orderNo || !deptID) {
      return res.status(400).json({
        success: false,
        message: "Nama, Urutan, atau Departement Wajib Diisi !"
      })
    }

    await db.query(
      `
        UPDATE work_center SET workcen_name = '${name}', priority_no = ${orderNo}, dept_id = ${deptID} 
        WHERE workcen_id = ${workcenID}
      `
    )

    return res.status(200).json({
      success: true,
      message: `Berhasil Mengubah Work Center / Bagian Terpilih !`
    })
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: "Gagal Mengubah Work Center",
      detail: err
    })
  }
}

const delWC = async (req, res) => {
  try {
    const workcenID = req.params.id

    const workcen = await db.query(
      `
        DELETE FROM work_center WHERE workcen_id = ${workcenID} RETURNING workcen_name AS wc
      `
    )

    return res.status(200).json({
      success: true,
      message: `Work Center / Bagian ${workcen.rows[0].wc} Berhasil Dihapus !`
    })
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: "Work Center / Bagian Terpilih Gagal Dihapus !",
      detail: err
    })
  }
}


module.exports = {
  addWC,
  listWC,
  getWC,
  changeWC,
  delWC
}
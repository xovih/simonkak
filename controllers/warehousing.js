const db = require("../utils/connpg")
const moment = require("moment")
require("moment/locale/id")
moment.locale("id")

const add = async (req, res) => {
  try {
    const {
      userID,
      matID,
      receiver,
      notes,
      sapResvNo,
      qty
    } = req.body

    if (
      !matID ||
      !receiver ||
      !qty
    ) {
      return res.status(400).json({
        success: false,
        message: `Harap mengisi Semua inputan !`
      })
    }

    const addBy = userID ? userID : req.user.id
    const addAt = moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
    const sapNo = sapResvNo ? sapResvNo : ``
    const mNotes = notes ? notes : ``

    const catatan = await db.query(
      `
        INSERT INTO warehousing 
        (mat_id, user_id, receiver, notes, sap_resv_notes, qty, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING trid AS id
      `,
      [
        matID, addBy, receiver, mNotes, sapNo, qty, addAt
      ]
    )

    await db.query(
      `
        UPDATE products 
        SET 
          warehouse_stock = warehouse_stock + ${qty},
          updated_at = '${addAt}',
          updated_by = '${addBy}'
        WHERE mat_id = '${matID}'
      `
    )

    return res.status(200).json({
      success: true,
      message: `Penyimpanan Material Berhasil Dicatat dengan No : ${catatan.rows[0].id} !`
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal Menambahkan Transaksi !",
      detail: error
    })
  }
}

const del = async (req, res) => {
  try {
    const { id } = req.params

    const del = await db.query(
      `
        DELETE FROM warehousing WHERE trid = '${id}'
        RETURNING mat_id AS mat, qty
      `
    )

    const matID = del.rows[0].mat
    const qty = del.rows[0].qty

    await db.query(
      `
        UPDATE products SET warehouse_stock = warehouse_stock - ${qty}
        WHERE mat_id = '${matID}'
      `
    )

    return res.status(200).json({
      success: true,
      message: `Berhasil Menghapus Transaksi no ${id}`
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal Menghapus Transaksi !",
      detail: error
    })
  }
}

const list = async (req, res) => {
  try {
    let { search, page, limit } = req.query

    let queryLimit = ``

    if (parseInt(limit) > 0) {
      limit = limit ? parseInt(limit) : 10
      let offset = page ? (parseInt(page) - 1) * limit : 0

      queryLimit = `LIMIT ${limit} OFFSET ${offset}`
    }

    let queryData = `
      SELECT * FROM v_warehousing ORDER BY created_at DESC
      ${queryLimit}
    `
    let queryRows = `
      SELECT COUNT(*) AS total FROM v_warehousing 
    `

    if (search) {
      queryData = `
        SELECT * FROM v_warehousing 
        WHERE 
          cat_name ILIKE '%${search}%' OR
          mat_sap_no ILIKE '%${search}%' OR
          mat_desc ILIKE '%${search}%'
        ORDER BY created_at DESC
        ${queryLimit}
      `

      queryRows = `
        SELECT COUNT(*) AS total FROM v_warehousing 
        WHERE 
          cat_name ILIKE '%${search}%' OR
          mat_sap_no ILIKE '%${search}%' OR
          mat_desc ILIKE '%${search}%'
      `
    }

    const kk = await db.query(queryData)
    const total = await db.query(queryRows)

    res.status(200).json({
      success: true,
      message: "Data Ditemukan !",
      data: kk.rows,
      totalData: parseInt(total.rows[0].total),
      page: page && queryLimit.length > 0 ? parseInt(page) : 1,
      totalPage:
        queryLimit.length > 0
          ? Math.ceil(parseInt(total.rows[0].total) / limit)
          : 1,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal Mendapatkan Data Transaksi !",
      detail: error
    })
  }
}

const get = async (req, res) => {
  try {
    const { id } = req.params
    const getData = await db.query(
      `
        SELECT * FROM v_warehousing WHERE trid = '${id}'
      `
    )

    return res.status(200).json({
      success: true,
      message: `Data Transaksi Ditemukan !`,
      data: getData.rows[0]
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Data Transaksi Tidak Ditemukan !",
      detail: error
    })
  }
}

module.exports = {
  add,
  del,
  list,
  get
}
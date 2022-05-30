const db = require("../utils/connpg")
const moment = require("moment")
require("moment/locale/id")
moment.locale("id")

const addInspect = async (req, res) => {
  try {
    const {
      orderID,
      inspector,
      good,
      reject,
      rework,
      notes
    } = req.body

    if (
      !orderID ||
      !good ||
      !reject ||
      !rework
    ) {
      return res.status(400).json({
        success: false,
        message: `Harap mengisi Semua inputan !`
      })
    }

    const getOrder = await db.query(
      `
        SELECT qty FROM orders WHERE order_id = '${orderID}'
      `
    )

    const qty = parseInt(good) + parseInt(reject) + parseInt(rework)

    if (parseInt(qty) > parseInt(getOrder.rows[0].qty)) {
      return res.status(400).json({
        success: false,
        message: `Jumlah Barang yang Di-Inspeksi Melebihi Order yang Diminta !`
      })
    }

    const inspectBy = inspector ? inspector : req.user.id
    const inspectAt = moment(new Date()).format("YYYY-MM-DD HH:mm:ss")

    const catatan = await db.query(
      `
        INSERT INTO inspects 
        (order_id, inspector, res_good, res_reject, res_rework, notes, inspect_time)
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING insid AS id
      `,
      [
        orderID, inspectBy, good, reject, rework, notes, inspectAt
      ]
    )

    return res.status(200).json({
      success: true,
      message: `Inspeksi Order Berhasil Dicatat dengan No : ${catatan.rows[0].id} !`
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal Menambahkan Inspeksi !",
      detail: error
    })
  }
}

const delInspect = async (req, res) => {
  try {
    const { id } = req.params

    const delet = await db.query(
      `
        DELETE FROM inspects WHERE insid = '${id}'
        RETURNING insid AS id
      `
    )

    return res.status(200).json({
      success: true,
      message: `Berhasil Menghapus Catatan Inspeksi Order no ${delet.rows[0].id}`
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal Menghapus Catatan Inspeksi !",
      detail: error
    })
  }
}

const listInspect = async (req, res) => {
  try {
    let { search, page, limit } = req.query

    let queryLimit = ``

    if (parseInt(limit) > 0) {
      limit = limit ? parseInt(limit) : 10
      let offset = page ? (parseInt(page) - 1) * limit : 0

      queryLimit = `LIMIT ${limit} OFFSET ${offset}`
    }

    let queryData = `
      SELECT * FROM v_inspection ORDER BY inspect_time DESC
      ${queryLimit}
    `
    let queryRows = `
      SELECT COUNT(*) AS total FROM v_inspection 
    `

    if (search) {
      queryData = `
        SELECT * FROM v_inspection 
        WHERE 
          sap_order_no ILIKE '%${search}%' OR
          mat_sap_no ILIKE '%${search}%' OR
          mat_desc ILIKE '%${search}%'
        ORDER BY inspect_time DESC
        ${queryLimit}
      `

      queryRows = `
        SELECT COUNT(*) AS total FROM v_inspection 
        WHERE 
          sap_order_no ILIKE '%${search}%' OR
          mat_sap_no ILIKE '%${search}%' OR
          mat_desc ILIKE '%${search}%'
      `
    }

    if (req.body.orderID) {
      const { orderID } = req.body
      queryLimit = ``

      queryData = `
        SELECT * FROM v_inspection 
        WHERE 
          order_id = '${orderID}'
        ORDER BY inspect_time DESC
        ${queryLimit}
      `

      queryRows = `
        SELECT COUNT(*) AS total FROM v_inspection 
        WHERE 
          order_id = '${orderID}'
      `
    }

    const kk = await db.query(queryData)
    const total = await db.query(queryRows)

    res.status(200).json({
      success: true,
      message: "Catatan Inspeksi Ditemukan !",
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
      message: "Gagal Mendapatkan Catatan Inspeksi !",
      detail: error
    })
  }
}

module.exports = {
  addInspect,
  delInspect,
  listInspect
}
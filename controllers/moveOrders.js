const db = require("../utils/connpg")
const moment = require("moment")
require("moment/locale/id")

moment.locale("id")

const moving = async (req, res) => {
  try {
    const {
      orderID,
      fromwc,
      towc,
      qty,
      notes
    } = req.body

    const getOrder = await db.query(
      `
        SELECT qty FROM orders WHERE order_id = '${orderID}'
      `
    )

    if (
      !orderID ||
      !fromwc ||
      !towc ||
      !qty
    ) {
      return res.status(400).json({
        success: false,
        message: `Harap mengisi Semua inputan !`
      })
    }

    if (parseInt(qty) > parseInt(getOrder.rows[0].qty)) {
      return res.status(400).json({
        success: false,
        message: `Jumlah Barang yang Digeser Melebihi Order yang Diminta !`
      })
    }

    const movedBy = req.user.id
    const movedAt = moment(new Date()).format("YYYY-MM-DD HH:mm:ss")

    const catatan = await db.query(
      `
        INSERT INTO order_moves 
        (order_id, from_wc_no, to_wc_no, qty, moved_by, moved_time, notes) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING movid AS id
      `,
      [
        orderID,
        fromwc,
        towc,
        qty,
        movedBy,
        movedAt,
        notes
      ]
    )

    return res.status(200).json({
      success: true,
      message: `Penggeseran Order Berhasil Dicatat dengan No : ${catatan.rows[0].id} !`
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal mencatat penggeseran Order !",
      detail: error
    })
  }
}

const delMove = async (req, res) => {
  try {
    const { id } = req.params

    const delet = await db.query(
      `
        DELETE FROM order_moves WHERE movid = '${id}'
        RETURNING movid AS id
      `
    )

    return res.status(200).json({
      success: true,
      message: `Berhasil Menghapus Catatan Penggeseran Order no ${delet.rows[0].id}`
    })
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Gagal Menghapus Catatan Penggeseran Order !",
      deatil: e
    })
  }
}

const listMoves = async (req, res) => {
  try {
    let { search, page, limit } = req.query

    let queryLimit = ``

    if (parseInt(limit) > 0) {
      limit = limit ? parseInt(limit) : 10
      let offset = page ? (parseInt(page) - 1) * limit : 0

      queryLimit = `LIMIT ${limit} OFFSET ${offset}`
    }

    let queryData = `
      SELECT * FROM v_geser ORDER BY moved_time DESC
      ${queryLimit}
    `
    let queryRows = `
      SELECT COUNT(*) AS total FROM v_geser 
    `

    if (search) {
      queryData = `
        SELECT * FROM v_geser 
        WHERE 
          sap_order_no ILIKE '%${search}%' OR
          mat_sap_no ILIKE '%${search}%' OR
          mat_desc ILIKE '%${search}%'
        ORDER BY moved_time DESC
        ${queryLimit}
      `

      queryRows = `
        SELECT COUNT(*) AS total FROM v_geser 
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
        SELECT * FROM v_geser 
        WHERE 
          order_id = '${orderID}'
        ORDER BY moved_time DESC
        ${queryLimit}
      `

      queryRows = `
        SELECT COUNT(*) AS total FROM v_geser 
        WHERE 
          order_id = '${orderID}'
      `
    }

    const kk = await db.query(queryData)
    const total = await db.query(queryRows)

    res.status(200).json({
      success: true,
      message: "Catatan Penggeseran Ditemukan !",
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
      message: "Gagal Menampilkan Data !",
      detail: error
    })
  }
}

const getMove = async (req, res) => {
  try {
    const { id } = req.params
    const data = await db.query(
      `
        SELECT * FROM v_geser WHERE movid = '${id}'
      `
    )

    if (data.rowCount == 0) {
      return res.status(400).json({
        success: false,
        message: "Catatan Penggeseran Order Tidak Ditemukan !"
      })
    }

    return res.status(200).json({
      success: true,
      message: "Catatan Penggeseran Order Ditemukan !",
      data: data.rows[0]
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal Menampilkan Data !",
      detail: error
    })
  }
}

module.exports = {
  moving,
  delMove,
  listMoves,
  getMove,
}
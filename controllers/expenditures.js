const db = require("../utils/connpg")
const moment = require("moment")
require("moment/locale/id")
moment.locale("id")

const add = async (req, res) => {
  try {
    const {
      userID,
      customer,
      notes,
      items
    } = req.body

    const addBy = userID ? userID : req.user.id
    const users = customer ? customer : req.user.fullname
    const texts = notes ? notes : ''
    const tkini = moment(new Date()).format("YYYY-MM-DD HH:mm:ss")

    if (!items || items.length == 0) {
      return res.status(400).json({
        success: false,
        message: "Item Tidak Boleh Kosong !"
      })
    }

    const set = await db.query(
      `
        INSERT INTO expenditures 
        (user_id, item_count, customer, notes, created_at)
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING expid AS id
      `,
      [
        addBy, items.length, users, texts, tkini
      ]
    )

    const id = set.rows[0].id
    let trStatus = true
    let trNotes = ``

    for (let i = 0; i < items.length; i++) {
      const cekStock = await db.query(
        `
          SELECT 
            warehouse_stock AS stock, mat_sap_no AS matno, 
            mat_desc AS desc
          FROM products 
          WHERE mat_id = '${items[i].mat}'
          ORDER BY mat_id DESC
          LIMIT 1
        `
      )

      if (parseInt(cekStock.rows[0].stock) < parseInt(items[i].qty)) {

        const itemKosong = cekStock.rows[0]
        trStatus = false
        trNotes = `Stock Item ${itemKosong.matno} ${itemKosong.desc} kurang dari yang diminta !`

        break
      }

      await db.query(
        `
          INSERT INTO expenditure_details 
          (expid, mat_id, qty)
          VALUES ($1, $2, $3)
        `,
        [
          id,
          items[i].mat,
          items[i].qty
        ]
      )
    }

    if (!trStatus) {
      await db.query(
        `
          DELETE FROM expenditures WHERE expid = '${id}'
        `
      )

      return res.status(400).json({
        success: false,
        message: trNotes
      })
    }

    return res.status(200).json({
      success: true,
      message: "Input Data Transaksi Sukses !"
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Operasi Gagal !"
    })
  }
}

const del = async (req, res) => {
  try {
    const { id } = req.params

    const del = await db.query(
      `
        SELECT mat_id, qty, status 
        FROM expenditure_details 
        WHERE expid = '${id}'
      `
    )

    for (let i = 0; i < del.rowCount; i++) {
      if (del.rows[i].status == "Accepted") {
        await db.query(
          `
            UPDATE products SET 
            warehouse_stock = warehouse_stock + ${del.rows[i].qty} 
            WHERE mat_id = '${del.rows[i].mat_id}'
          `
        )

      }
    }


    await db.query(
      `
        DELETE FROM expenditures WHERE expid = '${id}'
      `
    )

    return res.status(200).json({
      success: true,
      message: `Sukses menghapus Transaksi ${id} !`
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Operasi Gagal !"
    })
  }
}

const set = async (req, res) => {
  try {
    const { id } = req.params
    const { status, notes } = req.body

    if (!status || !id) {
      return res.status(400).json({
        success: false,
        message: "Mohon Melengkapi Input Yang Diminta !"
      })
    }

    const note = notes ? notes : ``

    const set = await db.query(
      `
        UPDATE expenditure_details 
        SET 
          status = '${status}',
          reject_notes = '${note}'
        WHERE detail_id = '${id}'
        RETURNING mat_id, qty
      `
    )

    if (status == "Accepted") {
      await db.query(
        `
          UPDATE products SET 
          warehouse_stock = warehouse_stock - ${set.rows[0].qty} 
          WHERE mat_id = '${set.rows[0].mat_id}'
        `
      )
    }

    return res.status(200).json({
      success: true,
      message: `Sukses Mengubah Status Transaksi dan Stock !`
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Operasi Gagal !"
    })
  }
}

const reject = async (req, res) => {
  try {
    const { id } = req.params
    const { status, notes } = req.body
    const newStatus = "Rejected"

    if (!id || !status || !notes) {
      return res.status(400).json({
        success: false,
        message: "Mohon Melengkapi Input Yang Diminta !"
      })
    }

    const note = notes ? notes : ``

    const set = await db.query(
      `
        UPDATE expenditure_details 
        SET 
          status = '${newStatus}',
          reject_notes = '${note}'
        WHERE detail_id = '${id}'
        RETURNING mat_id, qty
      `
    )

    if (status == "Accepted") {
      await db.query(
        `
          UPDATE products SET 
          warehouse_stock = warehouse_stock + ${set.rows[0].qty} 
          WHERE mat_id = '${set.rows[0].mat_id}'
        `
      )
    }

    return res.status(200).json({
      success: true,
      message: `Sukses Mengubah Status Transaksi dan Stock !`
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Operasi Gagal !"
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
      SELECT * FROM expenditures ORDER BY created_at DESC
      ${queryLimit}
    `
    let queryRows = `
      SELECT COUNT(*) AS total FROM expenditures 
    `

    if (search) {
      queryData = `
        SELECT * FROM expenditures 
        WHERE 
          customer ILIKE '%${search}%' OR
          notes ILIKE '%${search}%'
        ORDER BY created_at DESC
        ${queryLimit}
      `

      queryRows = `
        SELECT COUNT(*) AS total FROM expenditures 
        WHERE 
          customer ILIKE '%${search}%' OR
          notes ILIKE '%${search}%'
      `
    }

    const kk = await db.query(queryData)
    const total = await db.query(queryRows)

    let data = []

    if (kk.rowCount > 0) {
      for (let i = 0; i < kk.rowCount; i++) {
        let exp = kk.rows[i]

        const item = await db.query(
          `
            SELECT * FROM expenditure_details WHERE expid = '${exp.expid}'
          `
        )

        exp.items = item.rows
        data.push(exp)
      }
    }

    res.status(200).json({
      success: true,
      message: "Data Ditemukan !",
      data,
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
      message: "Operasi Gagal !"
    })
  }
}

const get = async (req, res) => {
  try {
    const { id } = req.params

    const exps = await db.query(
      `
        SELECT * FROM v_exp_detail WHERE expid = '${id}'
        ORDER BY detail_id ASC
      `
    )

    if (exps.rowCount == 0) {
      return res.status(400).json({
        success: false,
        message: "Data Transaksi Tidak Ditemukan !"
      })
    }

    return res.status(200).json({
      success: true,
      message: "Data Transaksi Ditemukan !",
      data: exps.rows
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Operasi Gagal !"
    })
  }
}

module.exports = {
  add, del, set, get, list, reject
}
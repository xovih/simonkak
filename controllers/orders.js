const db = require("../utils/connpg")
const moment = require("moment")
require("moment/locale/id")

moment.locale("id")

const listOrders = async (req, res) => {
  try {
    const {
      f_status, f_priority, f_ordertype, f_mattype, search
    } = req.query

    let { page, limit } = req.query

    limit = limit ? parseInt(limit) : 20
    let offset = page ? (parseInt(page) - 1) * limit : 0

    let querySelect = `SELECT * FROM v_orders `
    let queryWhere = ``
    let queryOrder = `
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `
    if (f_status) {
      if (queryWhere.length == 0) {
        queryWhere = ` WHERE order_status = '${f_status}' `
      } else {
        queryWhere += ` AND order_status = '${f_status}' `
      }
    }

    if (f_priority) {
      if (queryWhere.length == 0) {
        queryWhere = ` WHERE is_priority = ${f_priority} `
      } else {
        queryWhere += ` AND is_priority = ${f_priority} `
      }
    }

    if (f_ordertype) {
      if (queryWhere.length == 0) {
        queryWhere = ` WHERE order_type = '${f_ordertype}' `
      } else {
        queryWhere += ` AND order_type = '${f_ordertype}' `
      }
    }

    if (f_mattype) {
      if (queryWhere.length == 0) {
        queryWhere = ` WHERE mat_type_id = '${f_mattype}' `
      } else {
        queryWhere += ` AND mat_type_id = '${f_mattype}' `
      }
    }

    if (search) {
      if (queryWhere.length == 0) {
        queryWhere = ` WHERE sap_order_no ILIKE '%${search}%' OR mat_desc ILIKE '%${search}%' `
      } else {
        queryWhere += ` AND (sap_order_no ILIKE '%${search}%' OR mat_desc ILIKE '%${search}%') `
      }
    }

    const query = querySelect + queryWhere + queryOrder

    const order = await db.query(query)

    if (order.rowCount == 0) {
      return res.status(400).json({
        success: false,
        message: "Data Order Tidak Ditemukan !"
      })
    }

    const total = await db.query(
      `SELECT COUNT(*) AS total FROM v_orders ` + queryWhere
    )

    return res.status(200).json({
      success: true,
      message: "Data Order Ditemukan !",
      data: order.rows,
      totalData: parseInt(total.rows[0].total),
      page: page ? parseInt(page) : 1,
      totalPage: Math.ceil(parseInt(total.rows[0].total) / limit)
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error !",
      detail: error
    })
  }

}

const getDetailOrder = async (req, res) => {
  try {
    const orderID = req.params.id

    const order = await db.query(`
      SELECT * FROM v_orders WHERE order_id = '${orderID}'
    `)

    if (order.rowCount == 0) {
      return res.status(400).json({
        success: false,
        message: "Order tidak Ditemukan !"
      })
    }

    const getTrackKK = await db.query(
      `
        SELECT * FROM v_kk_op 
        WHERE order_id = '${orderID}' 
        ORDER BY input_at DESC
      `
    )

    const getTrackMV = await db.query(
      `
        SELECT * FROM order_moves 
        WHERE order_id = '${orderID}' 
        ORDER BY moved_time DESC
      `
    )

    let trackMV = []
    for (let m = 0; m < getTrackMV.rowCount; m++) {
      let mv = getTrackMV.rows[m]
      const kasi = await db.query(`SELECT npp, fullname FROM users WHERE user_id = '${mv.moved_by}'`)

      const fromW = await db.query(`SELECT workcen_name AS bagian FROM work_center WHERE workcen_id = '${mv.from_wc_no}'`)

      const toW = await db.query(`SELECT workcen_name AS bagian FROM work_center WHERE workcen_id = '${mv.to_wc_no}'`)

      const dataMV = {
        id: mv.movid,
        time: mv.moved_time,
        from: fromW.rows[0].bagian,
        to: toW.rows[0].bagian,
        qty: mv.qty,
        notes: mv.notes,
        by_npp: kasi.rows[0].npp,
        by_name: kasi.rows[0].fullname,
      }

      trackMV.push(dataMV)
    }

    const inspects = await db.query(
      `
        SELECT * FROM v_inspection WHERE order_id = '${orderID}'
        ORDER BY inspect_time DESC
      `
    )

    return res.status(200).json({
      success: true,
      message: "Order Ditemukan !",
      data: order.rows[0],
      kk: getTrackKK.rows,
      mv: trackMV,
      qa: inspects.rows
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error !",
      detail: error
    })
  }
}

const addOrder = async (req, res) => {
  try {
    const {
      orderNo, matNo, matDesc, imgNo, qty, unit, dueDate, matType
    } = req.body

    const isPriority = req.body.isPriority ? req.body.isPriority : false
    const orderType = req.body.orderType ? req.body.orderType : "Eksternal"

    const userID = req.user.id
    const saatIni = moment(new Date()).format("YYYY-MM-DD HH:mm:ss")

    if (!orderNo || !matNo || !imgNo || !matDesc || !qty || !dueDate || !matType || !unit) {
      return res.status(400).json({
        success: false,
        message: "Harap Mengisi Semua Inputan dengan Lengkap !"
      })
    }

    const cekOrder = await db.query(
      `SELECT * FROM orders WHERE sap_order_no = '${orderNo}'`
    )

    if (cekOrder.rowCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Order dengan nomor ${cekOrder.rows[0].sap_order_no} sudah pernah diinput pada ${cekOrder.rows[0].created_at}`
      })
    }

    const cekMat = await db.query(
      `SELECT mat_id AS id FROM products WHERE mat_sap_no = '${matNo}'`
    )

    let matID = ''


    if (cekMat.rowCount == 0) {
      const qty = 0
      const newMat = await db.query(
        `
          INSERT INTO products 
            (mat_sap_no, mat_desc, img_no, mat_type, warehouse_stock, unit, created_at, created_by) 
          VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING mat_id AS id
        `,
        [matNo, matDesc, imgNo, matType, qty, unit, saatIni, userID]
      )

      matID = newMat.rows[0].id
    } else {
      matID = cekMat.rows[0].id
    }

    await db.query(
      `
        INSERT INTO orders 
          (sap_order_no, order_type, mat_id, qty, due_date, is_priority, created_at, created_by) 
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [orderNo, orderType, matID, qty, dueDate, isPriority, saatIni, userID]
    )

    return res.status(200).json({
      success: true,
      message: "Input data order berhasil !"
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error !",
      detail: error
    })
  }
}

const importOrders = async (req, res) => {
  try {
    const { orders } = req.body

    let inserted = 0
    for (let i = 0; i < orders.length; i++) {

      const {
        orderNo, matNo, matDesc, imgNo, qty, unit, dueDate, matType
      } = orders[i]

      const isPriority = orders[i].isPriority ? orders[i].isPriority : false
      const orderType = orders[i].orderType ? orders[i].orderType : "Eksternal"

      const userID = req.user.id
      const saatIni = moment(new Date()).format("YYYY-MM-DD HH:mm:ss")

      const cekOrder = await db.query(
        `SELECT * FROM orders WHERE sap_order_no = '${orderNo}'`
      )

      if (cekOrder.rowCount == 0) {

        const cekMat = await db.query(
          `SELECT mat_id AS id FROM products WHERE mat_sap_no = '${matNo}'`
        )

        let matID = ''

        if (cekMat.rowCount == 0) {
          const qty = 0
          const newMat = await db.query(
            `
            INSERT INTO products 
              (mat_sap_no, mat_desc, img_no, mat_type, warehouse_stock, unit, created_at, created_by) 
            VALUES
              ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING mat_id AS id
          `,
            [matNo, matDesc, imgNo, matType, qty, unit, saatIni, userID]
          )

          matID = newMat.rows[0].id
        } else {
          matID = cekMat.rows[0].id
          await db.query(
            `
              UPDATE products SET
                mat_sap_no = $1, mat_desc = $2, img_no = $3, mat_type = $4, unit = $5, updated_at = $6, updated_by = $7 
              WHERE
                mat_id = $8
            `,
            [matNo, matDesc, imgNo, matType, unit, saatIni, userID, matID]
          )
        }

        await db.query(
          `
          INSERT INTO orders 
            (sap_order_no, order_type, mat_id, qty, due_date, is_priority, created_at, created_by) 
          VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
          [orderNo, orderType, matID, qty, dueDate, isPriority, saatIni, userID]
        )

        inserted++
      }
    }


    return res.status(200).json({
      success: true,
      message: "Import data order berhasil !",
      detail: `Jumlah sukses: ${inserted} dari ${orders.length}`
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error !",
      detail: error
    })
  }
}

const delOrder = async (req, res) => {
  try {
    const { id } = req.params

    const del = await db.query(`DELETE FROM orders WHERE order_id = '${id}' RETURNING sap_order_no`)

    return res.status(200).json({
      success: true,
      message: `Berhasil menghapus order ${del.rows[0].sap_order_no} !`
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error !",
      detail: error
    })
  }
}

module.exports = {
  addOrder,
  importOrders,
  listOrders,
  getDetailOrder,
  delOrder
}
const db = require("../utils/connpg")
const moment = require("moment")
const res = require("express/lib/response")
require("moment/locale/id")
moment.locale("id")

const addWO = async (req, res) => {
  try {
    const {
      empID,
      workDesc,
      startTime,
      finishTime,
      isFinish,
      notes
    } = req.body

    if (
      !workDesc ||
      !startTime ||
      !finishTime
    ) {
      return res.status(400).json({
        success: false,
        message: "Harap mengisi semua Inputan !"
      })
    }

    const emp = empID ? empID : req.user.id
    const usr = req.user.id
    const note = notes ? notes : ''
    const finish = isFinish ? isFinish : true
    const kini = moment(new Date()).format("YYYY-MM-DD HH:mm:ss")

    await db.query(
      `
        INSERT INTO work_orders 
        (emp_id, work_desc, start_time, end_time, is_finish, input_by, input_at, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        emp, workDesc, startTime, finishTime, finish, usr, kini, note
      ]
    )

    return res.status(200).json({
      success: true,
      message: "Catatan Kerja berhasil Ditambahkan !"
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal menambahkan Catatan Kerja !"
    })
  }
}

const updateWO = async (req, res) => {
  try {
    const { id } = req.params
    const {
      workDesc,
      startTime,
      finishTime,
      isFinish,
      notes
    } = req.body

    if (
      !workDesc ||
      !startTime ||
      !finishTime
    ) {
      return res.status(400).json({
        success: false,
        message: "Harap mengisi semua Inputan !"
      })
    }

    const usr = req.user.id
    const note = notes ? notes : ''
    const finish = isFinish ? isFinish : true
    const kini = moment(new Date()).format("YYYY-MM-DD HH:mm:ss")

    await db.query(
      `
        UPDATE work_orders SET
        work_desc = $1, start_time = $2, end_time = $3, 
        is_finish = $4, update_by = $5, update_at = $6, notes = $7
        WHERE woid = $8
      `,
      [
        workDesc, startTime, finishTime, finish, usr, kini, note, id
      ]
    )

    return res.status(200).json({
      success: true,
      message: "Catatan Kerja berhasil Diubah !"
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal memperbarui Catatan Kerja !"
    })
  }
}

const delWO = async (req, res) => {
  try {
    const { id } = req.params

    await db.query(
      `
        DELETE FROM work_orders WHERE woid = '${id}'
      `
    )

    return res.status(200).json({
      success: true,
      message: "Berhasil Menghapus Catatan Kerja !"
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal menghapus Catatan Kerja !"
    })
  }
}

const listWO = async (req, res) => {
  try {
    let { search, page, limit } = req.query

    let queryLimit = ``

    if (parseInt(limit) > 0) {
      limit = limit ? parseInt(limit) : 10
      let offset = page ? (parseInt(page) - 1) * limit : 0

      queryLimit = `LIMIT ${limit} OFFSET ${offset}`
    }

    let queryData = `
      SELECT * FROM v_wo ORDER BY input_at DESC
      ${queryLimit}
    `
    let queryRows = `
      SELECT COUNT(*) AS total FROM v_wo 
    `

    if (search) {
      queryData = `
        SELECT * FROM v_wo 
        WHERE 
          fuulname ILIKE '%${search}%' OR
          npp ILIKE '%${search}%' OR
          work_desc ILIKE '%${search}%'
        ORDER BY input_at DESC
        ${queryLimit}
      `

      queryRows = `
        SELECT COUNT(*) AS total FROM v_wo 
        WHERE 
          fuulname ILIKE '%${search}%' OR
          npp ILIKE '%${search}%' OR
          work_desc ILIKE '%${search}%'
      `
    }

    const kk = await db.query(queryData)
    const total = await db.query(queryRows)

    return res.status(200).json({
      success: true,
      message: "Catatan Kerja Ditemukan !",
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
      message: "Gagal mendapatkan Catatan Kerja !",
      detail: error
    })
  }
}

const getWO = async (req, res) => {
  try {
    const { id } = req.params

    const wo = await db.query(
      `
        SELECT * FROM v_wo WHERE woid = '${id}'
      `
    )

    if (wo.rowCount == 0) {
      return res.status(400).json({
        success: false,
        message: "Catatan Kerja tidak Ditemukan !"
      })
    }

    const data = wo.rows[0]

    return res.status(200).json({
      success: true,
      message: "Catatan Kerja Tersedia!",
      data
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal mendapatkan Catatan Kerja !"
    })
  }
}

module.exports = {
  getWO, listWO, addWO, updateWO, delWO
}
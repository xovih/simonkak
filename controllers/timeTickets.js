const db = require("../utils/connpg")
const moment = require("moment")
require("moment/locale/id")

moment.locale("id")

const inputKK = async (req, res) => {
	try {
		const userID = req.user.id
		const { orderID, empID, macID, empTime, macTime, resGood, resBad } =
			req.body

		let wStatus = req.body.isFinish ? req.body.isFinish : false

		if (
			!orderID ||
			!empID ||
			!macID ||
			!empTime ||
			!macTime ||
			!resGood ||
			!resBad
		) {
			return res.status(400).json({
				success: false,
				message: "Semua inputan Wajib Diisi !",
			})
		}

		console.log(wStatus)

		const finishGood = wStatus == "true" ? resGood : 0
		const finishBadd = wStatus == "true" ? resBad : 0
		const semiGood = wStatus == "false" ? resGood : 0
		const semiBadd = wStatus == "false" ? resBad : 0

		console.log(finishGood, semiGood)

		const saatIni = moment(new Date()).format("YYYY-MM-DD HH:mm:ss")

		await db.query(
			`
        INSERT INTO time_tickets 
          (order_id, emp_id, mac_id, emp_time, mac_time, res_finish_good, res_finish_bad, res_semi_good, res_semi_bad, input_at, input_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `,
			[
				orderID,
				empID,
				macID,
				empTime,
				macTime,
				finishGood,
				finishBadd,
				semiGood,
				semiBadd,
				saatIni,
				userID,
			]
		)

		return res.status(200).json({
			success: true,
			message: "KK berhasil diinput !",
		})
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Gagal input KK !",
			detail: error,
		})
	}
}

const delKK = async (req, res) => {
	try {
		const { id } = req.params

		await db.query(
			`
        DELETE FROM time_tickets WHERE tick_id = '${id}'
      `
		)

		return res.status(200).json({
			success: true,
			message: `Berhasil menghapus kartu kerja ${id} !`,
		})
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Gagal Menghapus Kartu Kerja Terpilih !",
		})
	}
}

const listKK = async (req, res) => {
	try {
		const { filter } = req.params

		switch (filter) {
			case "single":
				const tickID = req.query.id

				const kkSingle = await db.query(
					`
            SELECT * FROM v_kk_detail WHERE tick_id = '${tickID}' ORDER BY input_at DESC LIMIT 1
          `
				)

				res.status(200).json({
					success: true,
					message: "Pemanggilan Data Kartu Kerja Sukses !",
					data: kkSingle.rows,
				})
				break

			case "perop":
				const empID = req.query.id
				const kkOP = await db.query(
					`
            SELECT * FROM v_kk_all WHERE emp_id = '${empID}' ORDER BY input_at DESC
          `
				)

				res.status(200).json({
					success: true,
					message: "Pemanggilan Data Kartu Kerja Sukses !",
					data: kkOP.rows,
				})
				break

			case "perorder":
				const orderID = req.query.id
				const kkAll = await db.query(
					`
            SELECT * FROM v_kk_detail WHERE order_id = '${orderID}' ORDER BY input_at DESC
          `
				)

				res.status(200).json({
					success: true,
					message: "Pemanggilan Data Kartu Kerja Sukses !",
					data: kkAll.rows,
				})
				break

			case "all":
				let { search, page, limit } = req.query

				let queryLimit = ``

				if (parseInt(limit) > 0) {
					limit = limit ? parseInt(limit) : 10
					let offset = page ? (parseInt(page) - 1) * limit : 0

					queryLimit = `LIMIT ${limit} OFFSET ${offset}`
				}

				let queryData = `
          SELECT * FROM v_kk_all ORDER BY input_at DESC
          ${queryLimit}
        `
				let queryRows = `
          SELECT COUNT(*) AS total FROM v_kk_all 
        `

				if (search) {
					queryData = `
            SELECT * FROM v_kk_all 
            WHERE 
              dal_code ILIKE '%${search}%' OR
              workcenter ILIKE '%${search}%' OR
              mat_type ILIKE '%${search}%'
            ORDER BY input_at DESC
            ${queryLimit}
          `

					queryRows = `
            SELECT COUNT(*) AS total FROM v_kk_all 
            WHERE 
              dal_code ILIKE '%${search}%' OR
              workcenter ILIKE '%${search}%' OR
              mat_type ILIKE '%${search}%'
          `
				}

				const kk = await db.query(queryData)
				const total = await db.query(queryRows)

				res.status(200).json({
					success: true,
					message: "Data Kartu Kerja Ditemukan !",
					data: kk.rows,
					totalData: parseInt(total.rows[0].total),
					page: page && queryLimit.length > 0 ? parseInt(page) : 1,
					totalPage:
						queryLimit.length > 0
							? Math.ceil(parseInt(total.rows[0].total) / limit)
							: 1,
				})
				break

			default:
				return res.status(400).json({
					success: false,
					message: "API End Point Salah !",
				})
		}
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Gagal Mendapatkan Data Kartu Kerja !",
		})
	}
}

module.exports = {
	inputKK,
	delKK,
	listKK,
}

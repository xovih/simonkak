const db = require("../utils/connpg")
const moment = require("moment")
require("moment/locale/id")

moment.locale("id")

const inputKK = async (req, res) => {
	try {
		const userID = req.user.id
		const { orderID, empID, macID, empTime, macTime, resGood, resBad } =
			req.body

		let wStatus = req.body.status ? req.body.status : true

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

		const finishGood = wStatus ? resGood : 0
		const finishBadd = wStatus ? resBad : 0
		const semiGood = !wStatus ? resGood : 0
		const semiBadd = !wStatus ? resBad : 0

		const saatIni = moment(new Date()).format("YYYY-MM-DD HH:mm:ss")

		await db.query(
			`
        INSERT INTO time_tickets 
          (order_id, emp_id, mac_id, emp_time, mac_time, res_finish_good, res_finish_bad, res_semi_good, res_semi_bad, input_at, input_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `
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

			case "byemp":
				const empID = req.query.id
				const kkOP = await db.query(
					`
            SELECT * FROM v_kk_detail emp_id = '${empID}' ORDER BY input_at DESC
          `
				)

				res.status(200).json({
					success: true,
					message: "Pemanggilan Data Kartu Kerja Sukses !",
					data: kkOP.rows,
				})
				break

			case "all":
				const kkAll = await db.query(
					`
            SELECT * FROM v_kk_detail 
          `
				)
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

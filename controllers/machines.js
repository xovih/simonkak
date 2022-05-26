const db = require("../utils/connpg")

const addMachine = async (req, res) => {
	try {
		const { dalCode, name, maxTime } = req.body

		if (!dalCode || !name || !maxTime) {
			return res.status(400).json({
				success: false,
				message: "Semua Inputan Wajib Diisi !",
			})
		}

		const insertData = await db.query(
			`
        INSERT INTO machines 
          (dal_code, mac_name, max_op_time) 
        VALUES 
          ($1, $2, $3) 
        RETURNING *
      `,
			[dalCode, name, maxTime]
		)

		return res.status(200).json({
			success: true,
			message: "Mesin Berhasil Ditambahkan !",
			data: insertData.rows[0],
		})
	} catch (error) {
		return res.status(400).json({
			success: false,
			message: "Gagal menambahkan Mesin !",
			detail: error,
		})
	}
}

const listMachines = async (req, res) => {
	try {
		let { search, page, limit } = req.query

		limit = limit ? parseInt(limit) : 10
		let offset = page ? (parseInt(page) - 1) * limit : 0

		if (search) {
			const total = await db.query(
				`SELECT COUNT(*) AS total FROM machines WHERE dal_code ILIKE '%${search}%' OR mac_name ILIKE '%${search}%'`
			)

			const mac = await db.query(
				`
        SELECT * FROM machines 
        WHERE dal_code ILIKE '%${search}%' OR mac_name ILIKE '%${search}%'
        ORDER BY dal_code ASC
        LIMIT ${limit} OFFSET ${offset}
      `
			)

			return res.status(200).json({
				success: true,
				message: "Data Mesin Ditemukan !",
				data: mac.rows,
				totalData: parseInt(total.rows[0].total),
				page: page ? parseInt(page) : 1,
				totalPage: Math.ceil(parseInt(total.rows[0].total) / limit),
			})
		}

		const total = await db.query(`SELECT COUNT(*) AS total FROM machines`)

		const mac = await db.query(
			`
        SELECT * FROM machines 
        ORDER BY dal_code ASC
        LIMIT ${limit} OFFSET ${offset}
      `
		)

		return res.status(200).json({
			success: true,
			message: "Data Masin Ditemukan !",
			data: mac.rows,
			totalData: parseInt(total.rows[0].total),
			page: page ? parseInt(page) : 1,
			totalPage: Math.ceil(parseInt(total.rows[0].total) / limit),
		})
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Internal Server Error !",
			detail: error,
		})
	}
}

const getMachine = async (req, res) => {
	try {
		const { id } = req.params

		const mac = await db.query(
			`
        SELECT * FROM machines WHERE mac_id = '${id}' 
      `
		)

		if (mac.rowCount == 0) {
			return res.status(400).json({
				success: false,
				message: "Mesin yang Dimaksut tidak Ditemukan !",
			})
		}

		return res.status(200).json({
			success: true,
			message: "Data Mesin Ditemukan !",
			data: mac.rows[0],
		})
	} catch (err) {
		return res.status(500).json({
			success: false,
			message: "Internal Server Error !",
			detail: err,
		})
	}
}

const updateMachine = async (req, res) => {
	try {
		const { id } = req.params
		const { dalCode, name, maxTime } = req.body

		if (!dalCode || !name || !maxTime) {
			return res.status(400).json({
				success: false,
				message: "Semua Inputan Wajib Diisi !",
			})
		}

		const changeData = await db.query(
			`
        UPDATE machines 
        SET dal_code = $1, mac_name = $2, max_op_time = $3
        RETURNING *
      `,
			[dalCode, name, maxTime]
		)

		return res.status(200).json({
			success: true,
			message: "Data Mesin Berhasil Diubah !",
			data: changeData.rows[0],
		})
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Gagal Mengubah Data Mesin !",
			detail: error,
		})
	}
}

const delMachines = async (req, res) => {
	try {
		const { id } = req.params

		const mac = await db.query(
			`
        DELETE FROM machines WHERE mac_id = '${id}' RETURNING dal_code, mac_name
      `
		)

		return res.status(200).json({
			success: true,
			message: `Mesin ${mac.rows[0].dal_code} ${mac.rows[0].mac_name} Berhasil Dihapus !`,
		})
	} catch (err) {
		return res.status(400).json({
			success: false,
			message: "Mesin Terpilih Gagal Dihapus !",
			detail: err,
		})
	}
}

module.exports = {
	addMachine,
	listMachines,
	getMachine,
	updateMachine,
	delMachines,
}

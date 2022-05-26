const db = require("../utils/connpg")
const bcrypt = require("bcrypt")

const addOp = async (req, res) => {
	try {
		const { npp, nickname, fullname, workcen_id, password } = req.body

		if (!npp || !nickname || !fullname || !workcen_id || !password) {
			return res.status(400).json({
				success: false,
				message: "Inputan tidak Lengkap !",
			})
		}

		const isOperator = true
		const actor_id = 4
		const foto = `uploads\\avatar.jpg`

		const salt = await bcrypt.genSalt(12)
		const hashedPassword = await bcrypt.hash(password, salt)

		const cekOp = await db.query(`
      SELECT * FROM users WHERE npp = '${npp}'
    `)

		if (cekOp.rowCount > 0) {
			if (cekOp.rows[0].is_active) {
				return res.status(400).json({
					success: false,
					message: `Input Operator Gagal, dikarenakan Operator dengan npp ${npp} sudah ada !`,
				})
			}

			await db.query(
				`
          UPDATE users 
          SET 
            is_active = true,
            nickname = '${nickname}', 
            fullname = '${fullname}', 
            workcen_id = ${workcen_id}, 
            password = '${hashedPassword}', 
          WHERE user_id = ${cekOp.rows[0].user_id}
        `
			)
		} else {
			await db.query(
				`INSERT INTO users(npp, nickname, fullname, photo, actor_id,  
          workcen_id, password, is_operator) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
				[
					npp,
					nickname,
					fullname,
					foto,
					actor_id,
					workcen_id,
					hashedPassword,
					isOperator,
				]
			)
		}

		return res.status(200).json({
			success: true,
			message: "Operator Berhasil Ditambahkan !",
		})
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Internal Server Error",
			detail: error,
		})
	}
}

const listOps = async (req, res) => {
	try {
		let { search, page, limit } = req.query

		limit = limit ? parseInt(limit) : 10
		let offset = page ? (parseInt(page) - 1) * limit : 0

		if (search) {
			const total = await db.query(
				`
          SELECT COUNT(*) AS total 
          FROM users 
          WHERE 
            (npp ILIKE '%${search}%' OR fullname ILIKE '%${search}%')
            AND is_operator = true AND is_active = true   
        `
			)

			const user = await db.query(
				`
        SELECT * FROM users 
        WHERE 
          (npp ILIKE '%${search}%' OR fullname ILIKE '%${search}%')
          AND is_operator = true AND is_active = true
        ORDER BY user_id ASC
        LIMIT ${limit} OFFSET ${offset}
      `
			)

			return res.status(200).json({
				success: true,
				message: "Data Operator Ditemukan !",
				data: user.rows,
				totalData: parseInt(total.rows[0].total),
				page: page ? parseInt(page) : 1,
				totalPage: Math.ceil(parseInt(total.rows[0].total) / limit),
			})
		}

		const total = await db.query(
			`SELECT COUNT(*) AS total FROM users WHERE is_operator = true AND is_active = true`
		)

		const user = await db.query(
			`
        SELECT * FROM users 
        WHERE is_operator = true AND is_active = true
        ORDER BY user_id ASC
        LIMIT ${limit} OFFSET ${offset}
      `
		)

		return res.status(200).json({
			success: true,
			message: "Data Operator Ditemukan !",
			data: user.rows,
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

const getOp = async (req, res) => {
	try {
		const userID = req.params.id

		const user = await db.query(
			`
        SELECT * FROM users WHERE user_id = '${userID}' AND is_operator = true AND is_active = true
      `
		)

		if (user.rowCount == 0) {
			return res.status(400).json({
				success: false,
				message: "Operator tidak Ditemukan !",
			})
		}

		return res.status(200).json({
			success: true,
			message: "Data Operator Ditemukan !",
			data: user.rows[0],
		})
	} catch (err) {
		return res.status(500).json({
			success: false,
			message: "Internal Server Error !",
			detail: err,
		})
	}
}

const changeOp = async (req, res) => {
	try {
		const userID = req.params.id
		const { nickname, fullname, workcen_id } = req.body

		if (!nickname || !fullname || !workcen_id)
			return res.status(400).json({
				success: false,
				message: "Inputan tidak Lengkap !",
			})

		await db.query(
			`
        UPDATE users 
        SET 
          nickname = $1, fullname = $2, 
          workcen_id = $3
        WHERE user_id = $4
      `,
			[nickname, fullname, workcen_id, userID]
		)

		return res.status(200).json({
			success: true,
			message: "Data Operator Berhasil Di-update !",
		})
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Internal Server Error",
			detail: error,
		})
	}
}

const delOP = async (req, res) => {
	try {
		const userID = req.params.id

		const user = await db.query(
			`
        UPDATE users SET is_active = false WHERE user_id = '${userID}' RETURNING npp, fullname
      `
		)

		return res.status(200).json({
			success: true,
			message: `Operator ${user.rows[0].npp} ${user.rows[0].fullname} Berhasil Dinonaktifkan !`,
		})
	} catch (err) {
		return res.status(400).json({
			success: false,
			message: "Operator Terpilih Gagal Dihapus !",
			detail: err,
		})
	}
}

module.exports = {
	addOp,
	listOps,
	getOp,
	changeOp,
	delOP,
}

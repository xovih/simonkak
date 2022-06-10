const db = require("../utils/connpg")
const bcrypt = require("bcrypt")

const addUser = async (req, res) => {
	try {
		let { npp, nickname, fullname, password } = req.body
		const { actor_id, workcen_id } = req.body

		if (
			!npp ||
			!nickname ||
			!fullname ||
			!actor_id ||
			!workcen_id ||
			!password
		) {
			return res.status(400).json({
				success: false,
				message: "Inputan tidak Lengkap !",
			})
		}

		npp = npp.trim()
		nickname = nickname.trim()
		fullname = fullname.trim()
		password = password.trim()

		const isOperator = req.body.isOperator ? req.body.isOperator : false
		const foto = `uploads\\avatar.jpg`

		const salt = await bcrypt.genSalt(12)
		const hashedPassword = await bcrypt.hash(password, salt)

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

		return res.status(200).json({
			success: true,
			message: "User Berhasil Ditambahkan !",
		})
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Internal Server Error",
			detail: error,
		})
	}
}

const listUsers = async (req, res) => {
	try {
		let { search, page, limit } = req.query

		let queryLimit = ``

		if (parseInt(limit) > 0) {
			limit = limit ? parseInt(limit) : 10
			let offset = page ? (parseInt(page) - 1) * limit : 0

			queryLimit = `LIMIT ${limit} OFFSET ${offset}`
		}

		if (search) {
			const total = await db.query(
				`SELECT COUNT(*) AS total FROM v_users WHERE npp ILIKE '%${search}%' OR fullname ILIKE '%${search}%'`
			)

			const user = await db.query(
				`
        SELECT 
					npp, nickname, fullname, photo, is_operator, workcenter, dept, role 
				FROM v_users 
        WHERE npp ILIKE '%${search}%' OR fullname ILIKE '%${search}%'
        ORDER BY user_id ASC
        ${queryLimit}
      `
			)

			return res.status(200).json({
				success: true,
				message: "Data User Ditemukan !",
				data: user.rows,
				totalData: parseInt(total.rows[0].total),
				page: page ? parseInt(page) : 1,
				totalPage:
					queryLimit.length > 0
						? Math.ceil(parseInt(total.rows[0].total) / limit)
						: 1,
			})
		}

		const total = await db.query(`SELECT COUNT(*) AS total FROM v_users`)

		const user = await db.query(
			`
        SELECT 
					npp, nickname, fullname, photo, is_operator, workcenter, dept, role 
				FROM v_users 
        ORDER BY user_id ASC
        ${queryLimit}
      `
		)

		return res.status(200).json({
			success: true,
			message: "Data User Ditemukan !",
			data: user.rows,
			totalData: parseInt(total.rows[0].total),
			page: page ? parseInt(page) : 1,
			totalPage:
				queryLimit.length > 0
					? Math.ceil(parseInt(total.rows[0].total) / limit)
					: 1,
		})
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Internal Server Error !",
			detail: error,
		})
	}
}

const getUser = async (req, res) => {
	try {
		const userID = req.params.id

		const user = await db.query(
			`
        SELECT * FROM v_users WHERE user_id = '${userID}'
      `
		)

		if (user.rowCount == 0) {
			return res.status(400).json({
				success: false,
				message: "User tidak Ditemukan !",
			})
		}

		const { password, ...data } = user.rows[0]

		return res.status(200).json({
			success: true,
			message: "Data user Ditemukan !",
			data,
		})
	} catch (err) {
		return res.status(500).json({
			success: false,
			message: "Internal Server Error !",
			detail: err,
		})
	}
}

const updateUser = async (req, res) => {
	try {
		const userID = req.params.id
		let { nickname, fullname } = req.body
		const { actor_id, workcen_id } = req.body

		if (!nickname || !fullname || !actor_id || !workcen_id)
			return res.status(400).json({
				success: false,
				message: "Inputan tidak Lengkap !",
			})

		nickname = nickname.trim()
		fullname = fullname.trim()

		const isOperator = req.body.isOperator ? req.body.isOperator : false

		await db.query(
			`
        UPDATE users 
        SET 
          nickname = $1, fullname = $2, 
          actor_id = $3, workcen_id = $4, is_operator = $5
        WHERE user_id = $6
      `,
			[nickname, fullname, actor_id, workcen_id, isOperator, userID]
		)

		return res.status(200).json({
			success: true,
			message: "User Berhasil Di-update !",
		})
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Internal Server Error",
			detail: error,
		})
	}
}

const delUser = async (req, res) => {
	try {
		const userID = req.params.id

		const user = await db.query(
			`
        UPDATE users SET is_active = false WHERE user_id = '${userID}' RETURNING npp, fullname
      `
		)

		return res.status(200).json({
			success: true,
			message: `User ${user.rows[0].npp} ${user.rows[0].fullname} Berhasil Dinonaktifkan !`,
		})
	} catch (err) {
		return res.status(400).json({
			success: false,
			message: "User Terpilih Gagal Dihapus !",
			detail: err,
		})
	}
}

const aktivasiUser = async (req, res) => {
	try {
		const userID = req.params.id

		const user = await db.query(
			`
        UPDATE users SET is_active = true WHERE user_id = '${userID}' RETURNING npp, fullname
      `
		)

		return res.status(200).json({
			success: true,
			message: `User ${user.rows[0].npp} ${user.rows[0].fullname} Aktif !`,
		})
	} catch (err) {
		return res.status(400).json({
			success: false,
			message: "User Terpilih Gagal Aktif !",
			detail: err,
		})
	}
}

const resetPassword = async (req, res) => {
	try {
		const userID = req.params.id
		const { newPass } = req.body

		const salt = await bcrypt.genSalt(12)
		const hashedPassword = await bcrypt.hash(newPass, salt)

		await db.query(
			`UPDATE users SET password = '${hashedPassword}' WHERE user_id = '${userID}'`
		)

		return res.status(200).json({
			success: true,
			message: "Password Berhasil Diubah !",
		})
	} catch (err) {
		return res.status(400).json({
			success: false,
			message: "Gagal me-reset Password !",
			detail: err,
		})
	}
}

module.exports = {
	addUser,
	listUsers,
	getUser,
	updateUser,
	delUser,
	resetPassword,
	aktivasiUser,
}

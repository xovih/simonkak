require("dotenv").config()
const db = require("../utils/connpg")
const bcrypt = require("bcrypt")
const uploadImg = require("../utils/uploadImage")

const getProfile = async (req, res) => {
	try {
		const userID = req.params.id

		const selUser = await db.query(`SELECT * FROM v_login WHERE user_id = $1`, [
			userID,
		])

		if (selUser.rowCount == 0) {
			return res.status(400).json({
				success: false,
				message: "User yang Dicari Tidak Tersedia !",
			})
		}

		const user = selUser.rows[0]
		const { password, ...data } = user

		return res.status(200).json({
			success: true,
			message: "Request Valid !",
			data: { ...data, avatar },
		})
	} catch (err) {
		return res.status(500).json({
			success: false,
			message: "Internal Server Error",
			detail: err,
		})
	}
}

const updateProfile = async (req, res) => {
	try {
		const userID = req.params.id
		const { nickname, fullname } = req.body

		if (!nickname || !fullname) {
			return res.status(400).json({
				success: false,
				message: "Nama panggilan & Lengkap Harus Diisi !",
			})
		}

		await db.query(
			`
        UPDATE users SET nickname = $1, fullname = $2 
        WHERE user_id = $3
      `,
			[nickname, fullname, userID]
		)

		return res.status(200).json({
			success: true,
			message: "Profil Berhasil di-Update !",
		})
	} catch (err) {
		return res.status(500).json({
			success: false,
			message: "Internal Server Error",
			detail: err,
		})
	}
}

const changePassword = async (req, res) => {
	try {
		const userID = req.params.id
		const { oldpass, newpass } = req.body

		if (!oldpass || !newpass) {
			return res.status(400).json({
				success: false,
				message: "Password Lama & Baru Wajib Diisi !",
			})
		}

		const getUser = await db.query(
			`
        SELECT password FROM users WHERE user_id = '${userID}' 
        ORDER BY user_id DESC LIMIT 1
      `
		)

		const { password } = getUser.rows[0]

		const validated = await bcrypt.compare(oldpass, password)
		if (!validated) {
			return res.status(401).json({
				success: false,
				message: "Password Verifikasi Salah !",
			})
		}

		const salt = await bcrypt.genSalt(12)
		const hashedPassword = await bcrypt.hash(newpass, salt)

		await db.query(
			`UPDATE users SET password = '${hashedPassword}' WHERE user_id = '${userID}'`
		)

		return res.status(200).json({
			success: true,
			message: "Password Berhasil Diubah !",
		})
	} catch (err) {
		return res.status(500).json({
			success: false,
			message: "Internal Server Error",
			detail: err,
		})
	}
}

const changeAvatar = (req, res) => {
	uploadImg(req, res, async (err) => {
		if (err)
			return res.status(400).send({
				success: false,
				message: "Hanya Diijinkan untuk Upload Gambar !",
			})

		if (!req.file)
			return res.status(400).send({
				success: false,
				message: "Silahkan sediakan Gambar terlebih dahulu !",
			})

		try {
			const userID = req.params.id
			const uploadAvatar = await db.query(
				`
          UPDATE users SET photo = '${req.file.path}' 
          WHERE user_id = '${userID}' 
          RETURNING photo
        `
			)

			const data = uploadAvatar.rows[0].photo

			return res.status(200).json({
				success: true,
				message: "Upload Foto Berhasil !",
				data,
			})
		} catch (error) {
			return res.status(500).json({
				success: false,
				message: "Internal Server Error",
				detail: error,
			})
		}
	})
}

module.exports = {
	getProfile,
	updateProfile,
	changePassword,
	changeAvatar,
}

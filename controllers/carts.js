const res = require("express/lib/response")
const db = require("../utils/connpg")

const addToCart = async (req, res) => {
	try {
		const { matID } = req.body
		const { id } = req.user

		const cekItem = await db.query(
			`
        SELECT warehouse_stock AS qty 
        FROM products 
        WHERE mat_id = '${matID}'  
      `
		)

		if (cekItem.rowCount > 0 && parseInt(cekItem.rows[0].qty) > 0) {
			const cekCC = await db.query(
				`
        SELECT * FROM carts
        WHERE user_id = '${id}' AND mat_id = '${matID}'
        ORDER BY cart_id DESC LIMIT 1
      `
			)

			if (cekCC.rowCount > 0) {
				if (parseInt(cekItem.rows[0].qty) < parseInt(cekCC.rows[0].qty) + 1) {
					return res.status(400).json({
						success: false,
						message: "Stock produk kurang !",
					})
				}

				const updated = await db.query(
					`
          UPDATE carts SET qty = qty + 1
          WHERE cart_id = '${cekCC.rows[0].cart_id}'
          RETURNING *
        `
				)

				return res.status(200).json({
					success: true,
					message: "Berhasil menambahkan item ke keranjang !",
					data: updated.rows[0],
				})
			}

			const inserted = await db.query(
				`
        INSERT INTO carts (user_id, mat_id)
        VALUES ($1, $2)
        RETURNING *
      `,
				[id, matID]
			)

			return res.status(200).json({
				success: true,
				message: "Berhasil menambahkan item ke keranjang !",
				data: inserted.rows[0],
			})
		} else {
			return res.status(400).json({
				success: false,
				message: "Stock produk kosong !",
			})
		}
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Gagal menambahkan item ke kerajang !",
			detail: error,
		})
	}
}

const removeItem = async (req, res) => {
	try {
		const matID = req.params.id
		const { id } = req.user

		await db.query(
			`
        DELETE FROM carts
        WHERE user_id = '${id}' AND mat_id = '${matID}'
      `
		)

		return res.status(200).json({
			success: true,
			message: "Berhasil menghapus item di keranjang !",
		})
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Gagal menghapus item di kerajang !",
			detail: error,
		})
	}
}

const eraseAll = async (req, res) => {
	try {
		const { id } = req.user
		await db.query(
			`
        DELETE FROM carts
        WHERE user_id = '${id}'
      `
		)

		return res.status(200).json({
			success: true,
			message: "Berhasil mongosongkan keranjang !",
		})
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Gagal mengosongkan kerajang !",
			detail: error,
		})
	}
}

const updQty = async (req, res) => {
	try {
		const { matID, qty } = req.body
		const { id } = req.user

		const cekItem = await db.query(
			`
        SELECT warehouse_stock AS qty 
        FROM products 
        WHERE mat_id = '${matID}'  
      `
		)

		if (cekItem.rowCount > 0 && parseInt(cekItem.rows[0].qty) >= qty) {
			await db.query(
				`
        UPDATE carts
        SET qty = ${qty}
        WHERE user_id = '${id}' AND mat_id = '${matID}'
      `
			)

			return res.status(200).json({
				success: true,
				message: "Berhasil mengubah jumlah item !",
			})
		}

		return res.status(400).json({
			success: false,
			message: `Stock di Gudang Kurang !`,
			stock: cekItem.rows[0].qty,
		})
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Gagal mengubah jumlah item !",
			detail: error,
		})
	}
}

const getUserCart = async (req, res) => {
	try {
		const userID = req.user.id

		const data = await db.query(
			`
        SELECT * FROM v_user_cart WHERE user_id = '${userID}'
        ORDER BY cart_id DESC
      `
		)

		return res.status(200).json({
			success: true,
			message: "Request Valid !",
			data: data.rows,
		})
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Internal Server Error",
			detail: error,
		})
	}
}

module.exports = {
	addToCart,
	removeItem,
	eraseAll,
	updQty,
	getUserCart,
}

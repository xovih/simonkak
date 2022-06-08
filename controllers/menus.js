const db = require("../utils/connpg")

const addMenu = async (req, res) => {
  try {
    const { link, activeClass, icon, label, type, category, parentID } = req.body

    if (!link || !activeClass || !label || !icon) {
      return res.status(400).json({
        success: false,
        message: "Link, Active Class, Icon, Label Wajib Diisi !"
      })
    }

    const orderNo = req.body.orderNo ? req.body.orderNo : 1

    let query = `
      INSERT INTO menus (link, active_class, icon, label, type, category, order_no) 
      VALUES ('${link}', '${activeClass}', '${icon}', '${label}', '${type}', '${category}', ${orderNo}) 
      RETURNING *
    `

    if (parentID) {
      query = `
        INSERT INTO menus (link, active_class, icon, label, type, category, parent_id, order_no) 
        VALUES ('${link}', '${activeClass}', '${icon}', '${label}', '${type}', '${category}', ${parentID}, ${orderNo}) 
        RETURNING *
      `
    }

    const insertData = await db.query(query)

    return res.status(200).json({
      success: true,
      message: "Menu Berhasil Ditambahkan !",
      data: insertData.rows[0]
    })

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Gagal menambahkan Menu !",
      detail: error
    })
  }
}

const listMenu = async (req, res) => {
  try {
    let { search, page, limit } = req.query

    const types =
      req.params.types == 'child' ?
        `type = 'child'` :
        `NOT type = 'child'`

    limit = limit ? parseInt(limit) : 10
    let offset = page ? (parseInt(page) - 1) * limit : 0

    if (search) {
      const total = await db.query(`
        SELECT COUNT(*) AS total 
        FROM menus
        WHERE
          label ILIKE '%${search}%' AND
          ${types}
      `)

      const menu = await db.query(
        `
        SELECT * FROM menus 
        WHERE 
          label ILIKE '%${search}%' AND
          ${types}
        ORDER BY menu_id DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      )

      return res.status(200).json({
        success: true,
        message: "Data Menu Ditemukan !",
        data: menu.rows,
        totalData: parseInt(total.rows[0].total),
        page: page ? parseInt(page) : 1,
        totalPage: Math.ceil(parseInt(total.rows[0].total) / limit)
      })
    }

    const total = await db.query(`
      SELECT COUNT(*) AS total FROM menus
      WHERE ${types}
    `)

    const menu = await db.query(
      `
        SELECT * FROM menus 
        WHERE ${types}
        ORDER BY menu_id DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    )

    return res.status(200).json({
      success: true,
      message: "Data Menu Ditemukan !",
      data: menu.rows,
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

const getMenu = async (req, res) => {
  try {
    const menuID = req.params.id

    const menu = await db.query(
      `
        SELECT * FROM menus WHERE menu_id = ${menuID} 
      `
    )

    if (menu.rowCount == 0) {
      return res.status(400).json({
        success: false,
        message: "Menu yang Dimaksut tidak Ditemukan !"
      })
    }

    return res.status(200).json({
      success: true,
      message: "Data Menu Ditemukan !",
      data: menu.rows[0]
    })

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error !",
      detail: err
    })
  }
}

const changeMenu = async (req, res) => {
  try {
    const menuID = req.params.id
    const { link, activeClass, icon, label, type, category, parentID } = req.body

    const orderNo = req.body.orderNo ? req.body.orderNo : 1

    if (!link || !activeClass || !label || !icon) {
      return res.status(400).json({
        success: false,
        message: "Link, Active Class, Icon, Label Wajib Diisi !"
      })
    }

    let query = `
      UPDATE menus
      SET 
        link = '${link}', active_class = '${activeClass}', icon = '${icon}', label = '${label}', type = '${type}', category = '${category}', order_no = ${orderNo} 
      WHERE menu_id = ${menuID}
      RETURNING *
    `

    if (parentID) {
      query = `
        UPDATE menus
        SET 
          link = '${link}', active_class = '${activeClass}', icon = '${icon}', label = '${label}', type = '${type}', category = '${category}', parent_id = ${parentID}, order_no = ${orderNo} 
        WHERE menu_id = ${menuID}
        RETURNING *
      `
    }

    const changeData = await db.query(query)

    return res.status(200).json({
      success: true,
      message: "Menu Berhasil Diubah !",
      data: changeData.rows[0]
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal Mengubah Data Menu !",
      detail: error
    })
  }
}

const delMenu = async (req, res) => {
  try {
    const menuID = req.params.id

    const menu = await db.query(
      `
        DELETE FROM menus WHERE menu_id = ${menuID} RETURNING label
      `
    )

    return res.status(200).json({
      success: true,
      message: `Menu ${menu.rows[0].label} Berhasil Dihapus !`
    })
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: "Menu Terpilih Gagal Dihapus !",
      detail: err
    })
  }
}

module.exports = {
  addMenu,
  listMenu,
  getMenu,
  changeMenu,
  delMenu
}
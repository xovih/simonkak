const db = require("../utils/connpg")

const addMenu = async (req, res) => {
  try {
    const { link, activeClass, icon, label, type, category, parentID } = req.body

    if (!link || !activeClass || !label) {
      return res.status(400).json({
        success: false,
        message: "Link, Active Class, Label Wajib Diisi !"
      })
    }

    const cek = await db.query(
      `
        SELECT * FROM menus WHERE label = '${label}' AND link = '${link}'
      `
    )

    if (cek.rowCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Menu ${label} (${link}) sudah ada !`
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

    let types = ''

    if (req.params.types == 'child') types = ` type = 'child'`
    if (req.params.types == 'parent') types = ` NOT type = 'child'`

    let queryLimit = ``

    if (parseInt(limit) > 0) {
      limit = limit ? parseInt(limit) : 10
      let offset = page ? (parseInt(page) - 1) * limit : 0

      queryLimit = `LIMIT ${limit} OFFSET ${offset}`
    }

    if (search) {
      types = ` AND ${types}`
      const total = await db.query(`
        SELECT COUNT(*) AS total 
        FROM menus
        WHERE
          label ILIKE '%${search}%'
          ${types}
      `)

      const menu = await db.query(
        `
        SELECT * FROM menus 
        WHERE 
          label ILIKE '%${search}%'
          ${types}
        ORDER BY label ASC
        ${queryLimit}
      `
      )

      return res.status(200).json({
        success: true,
        message: "Data Menu Ditemukan !",
        data: menu.rows,
        totalData: parseInt(total.rows[0].total),
        page: page ? parseInt(page) : 1,
        totalPage:
          queryLimit.length > 0
            ? Math.ceil(parseInt(total.rows[0].total) / limit)
            : 1,
      })
    }

    if (types.length > 0) types = ` WHERE ${types}`
    const total = await db.query(`
      SELECT COUNT(*) AS total FROM menus
      ${types}
    `)

    const menu = await db.query(
      `
        SELECT * FROM menus 
        ${types}
        ORDER BY menu_id ASC
        ${queryLimit}
      `
    )

    return res.status(200).json({
      success: true,
      message: "Data Menu Ditemukan !",
      data: menu.rows,
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
      detail: error
    })
  }
}

const getChildCount = async (req, res) => {
  try {

    const { id } = req.params

    const total = await db.query(`
      SELECT COUNT(*) AS total FROM menus
      WHERE parent_id = ${id} 
    `)

    return res.status(200).json({
      success: true,
      message: "Data Menu Ditemukan !",
      data: parseInt(total.rows[0].total),
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error !",
      detail: error
    })
  }
}

const getParentName = async (req, res) => {
  try {

    const { id } = req.params

    const menu = await db.query(`
      SELECT label FROM menus
      WHERE menu_id = ${id} 
      ORDER BY menu_id DESC
      LIMIT 1
    `)

    return res.status(200).json({
      success: true,
      message: "Data Menu Ditemukan !",
      data: menu.rows[0].label,
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

    if (!link || !activeClass || !label) {
      return res.status(400).json({
        success: false,
        message: "Link, Active Class, Label Wajib Diisi !"
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
  delMenu,
  getChildCount,
  getParentName
}
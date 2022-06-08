const db = require("../utils/connpg")

const addActor = async (req, res) => {
  try {
    const { role } = req.body

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role Aktor Wajib Diisi !"
      })
    }

    let query = `
      INSERT INTO actors (role) 
      VALUES ('${role}') 
      RETURNING *
    `

    const insertData = await db.query(query)

    return res.status(200).json({
      success: true,
      message: "Actor Berhasil Ditambahkan !",
      data: insertData.rows[0]
    })

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Gagal menambahkan Actor !",
      detail: error
    })
  }
}

const listActors = async (req, res) => {
  try {
    let { search, page, limit } = req.query

    limit = limit ? parseInt(limit) : 10
    let offset = page ? (parseInt(page) - 1) * limit : 0

    if (search) {
      const total = await db.query(`SELECT COUNT(*) AS total FROM actors WHERE role ILIKE '%${search}%'`)

      const actor = await db.query(
        `
        SELECT * FROM actors 
        WHERE role ILIKE '%${search}%'
        ORDER BY actor_id ASC
        LIMIT ${limit} OFFSET ${offset}
      `
      )

      return res.status(200).json({
        success: true,
        message: "Data Aktor Ditemukan !",
        data: actor.rows,
        totalData: parseInt(total.rows[0].total),
        page: page ? parseInt(page) : 1,
        totalPage: Math.ceil(parseInt(total.rows[0].total) / limit)
      })
    }

    const total = await db.query(`SELECT COUNT(*) AS total FROM actors`)

    const actor = await db.query(
      `
        SELECT * FROM actors 
        ORDER BY actor_id ASC
        LIMIT ${limit} OFFSET ${offset}
      `
    )

    return res.status(200).json({
      success: true,
      message: "Data Aktor Ditemukan !",
      data: actor.rows,
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

const getActor = async (req, res) => {
  try {
    const actorID = req.params.id

    const actor = await db.query(
      `
        SELECT * FROM actors WHERE actor_id = ${actorID} 
      `
    )

    if (actor.rowCount == 0) {
      return res.status(400).json({
        success: false,
        message: "Aktor yang Dimaksut tidak Ditemukan !"
      })
    }

    return res.status(200).json({
      success: true,
      message: "Data Aktor Ditemukan !",
      data: actor.rows[0]
    })

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error !",
      detail: err
    })
  }
}

const renameActor = async (req, res) => {
  try {
    const actorID = req.params.id
    const { role } = req.body


    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role Aktor Wajib Diisi !"
      })
    }

    let query = `
      UPDATE actors
      SET role = '${role}'
      WHERE actor_id = ${actorID}
      RETURNING *
    `

    const changeData = await db.query(query)

    return res.status(200).json({
      success: true,
      message: "Aktor Berhasil Diubah !",
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

const delActor = async (req, res) => {
  try {
    const actorID = req.params.id

    const actor = await db.query(
      `
        DELETE FROM actors WHERE actor_id = ${actorID} RETURNING role
      `
    )

    return res.status(200).json({
      success: true,
      message: `Aktor ${actor.rows[0].role} Berhasil Dihapus !`
    })
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: "Aktor Terpilih Gagal Dihapus !",
      detail: err
    })
  }
}

const copyActor = async (req, res) => {
  try {
    const actorID = req.params.id
    const newRole = req.body.newRole

    const actor = await db.query(
      `
        INSERT INTO actors (role)
        VALUES ('${newRole}')
        RETURNING *
      `
    )

    const newActor = actor.rows[0]

    const actorMenu = await db.query(
      `
        SELECT menu_id, link, active_class, icon, label, type, category, parent_id, order_no FROM v_actor_menus WHERE actor_id = ${actorID} 
      `
    )

    if (actorMenu.rowCount > 0) {
      const role = actorMenu.rows
      const newID = newActor.actor_id

      for (let i = 0; i < actorMenu.rowCount; i++) {
        const menuID = role[i].menu_id

        await db.query(`
          INSERT INTO actor_details (actor_id, menu_id)
          VALUES (${newID}, ${menuID})
        `)
      }
    }

    return res.status(200).json({
      success: true,
      message: "Copy Aktor Berhasil",
      data: {
        role: newActor,
        accessMenu: actorMenu.rows
      }
    })

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error !",
      detail: err
    })
  }
}

const addMenu = async (req, res) => {
  try {
    const actorID = req.params.id
    const menuID = req.body.menuID

    await db.query(
      `
        INSERT INTO actor_details (actor_id, menu_id)
        VALUES (${actorID}, ${menuID})
      `
    )

    return res.status(200).json({
      success: true,
      message: "Menu Berhasil Ditambahkan !"
    })

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Operasi Gagal !",
      detail: err
    })
  }
}

const delMenu = async (req, res) => {
  try {
    const detailID = req.params.id

    await db.query(
      `
        DELETE FROM actor_details WHERE detail_id = ${detailID}
      `
    )

    return res.status(200).json({
      success: true,
      message: "Menu Terpilih Berhasil Dihapus !"
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Operasi Gagal !",
      detail: err
    })
  }
}

const actorMenus = async (req, res) => {
  try {
    const category = req.params.cat
    const actorID = req.params.id
    const menuType = req.params.type

    let type =
      menuType == 'child'
        ? ` AND type = 'child'`
        : ` AND NOT type = 'child'`

    if (menuType == 'all') {
      type = ""
    }

    let par = ``
    const parent = req.params.parent
    if (parent != "none") par = ` AND parent_id = ${parent}`

    const cat = category != 'all' ? ` AND category = '${category}' ` : ` `

    const menus = await db.query(
      `
        SELECT * FROM v_actor_menus 
        WHERE 
          actor_id = ${actorID} 
          ${cat}
          ${type}
          ${par}
        ORDER BY order_no ASC
      `
    )



    return res.status(200).json({
      success: true,
      message: "Request Valid !",
      data: menus.rows
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal mendapatkan menu !",
      detail: error
    })
  }
}


module.exports = {
  addActor,
  listActors,
  getActor,
  renameActor,
  delActor,
  copyActor,
  addMenu,
  delMenu,
  actorMenus
}
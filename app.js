// Configuration
require("dotenv").config()
const express = require("express")
const app = express()
const PORT = process.env.APP_PORT || 2812

// Routes Definition
const auth = require("./routes/auth")
const profile = require("./routes/profile")
const departements = require("./routes/departements")
const workCenters = require("./routes/workCenters")
const menus = require("./routes/menus")
const actors = require("./routes/actors")
const users = require("./routes/users")
const orders = require("./routes/orders")
const operators = require("./routes/operators")
const machines = require("./routes/machines")
const carts = require("./routes/carts")
const timeTickets = require("./routes/timeTickets")
const moveOrders = require("./routes/moveOrders")

// Input Configuration
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Access Configuration
app.use("/uploads", express.static("./uploads"))

// Routes Configuration
app.use("/auth", auth)
app.use("/profile", profile)
app.use("/departements", departements)
app.use("/workcenters", workCenters)
app.use("/menus", menus)
app.use("/actors", actors)
app.use("/users", users)
app.use("/orders", orders)
app.use("/operators", operators)
app.use("/machines", machines)
app.use("/carts", carts)
app.use("/timetickets", timeTickets)
app.use("/ordermoves", moveOrders)

app.listen(PORT, (err) => {
  if (err) {
    return console.log(err)
  }

  console.log(`Backend Server Running at Port : ${PORT}`)
})

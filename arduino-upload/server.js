const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const http = require("http")
const socketio = require("socket.io")

require("dotenv").config()

const app = express()
const server = http.createServer(app)
const io = socketio(server)

app.use(cors())
app.use(express.json())
app.use(express.static("public"))

/* =====================
MongoDB
===================== */

mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("MongoDB Connected"))
.catch(err=>console.log(err))

/* =====================
Schemas
===================== */

const Vehicle = mongoose.model("vehicles",{
vehicle_id:Number,
rfid_tag_id:String,
vehicle_number:String,
owner_id:Number,
vehicle_type:String,
status:String
})

const Driver = mongoose.model("drivers",{
driver_id:Number,
rfid_tag_id:String,
name:String,
license_number:String,
license_expiry:String,
mobile_number:String
})

const Entry = mongoose.model("highway_entries",{
vehicle_id:Number,
driver_id:Number,
entry_time:Date,
entrance_location_id:String
})

const Exit = mongoose.model("highway_exit",{
vehicle_id:Number,
driver_id:Number,
entry_time:Date,
exit_time:Date,
exit_location_id:String,
speed:Number,
status:String
})
/* =====================
Memory (active trip)
===================== */

let scannedVehicle = null
let scannedDrivers = []

let activeTrip = null

/* =====================
Vehicle Scan
===================== */

app.post("/vehicle-scan", async(req,res)=>{

const {uid} = req.body

console.log("Vehicle UID:",uid)

const vehicle = await Vehicle.findOne({rfid_tag_id:uid})

if(!vehicle)
return res.json({error:"vehicle not found"})

scannedVehicle = vehicle
scannedDrivers = []

io.emit("vehicleEntered",vehicle)

res.json({status:"vehicle detected"})

})

/* =====================
Human Scan
===================== */

app.post("/human-scan", async(req,res)=>{

const {uid} = req.body

console.log("Human UID:",uid)

const driver = await Driver.findOne({rfid_tag_id:uid})

if(!driver)
return res.json({error:"driver not found"})

scannedDrivers.push(driver)

io.emit("driverScanned",driver)

res.json({status:"driver added"})

})

/* =====================
Driver Selected
===================== */

app.post("/select-driver",(req,res)=>{

const {driver_id} = req.body

const driver = scannedDrivers.find(d=>d.driver_id==driver_id)

if(!driver)
return res.json({error:"driver not scanned"})

const entryTime = new Date()

const entry = new Entry({

vehicle_id:scannedVehicle.vehicle_id,
driver_id:driver.driver_id,
entry_time:entryTime,
entrance_location_id:"Z"

})

entry.save()

activeTrip = {
vehicle: scannedVehicle,
driver: driver,
entry_time: entryTime,
speed:0
}

io.emit("driverSelected",{
vehicle:scannedVehicle,
driver:driver
})

scannedVehicle=null
scannedDrivers=[]

res.json({status:"entry saved"})

})

/* =====================
Speed From A&B
===================== */

app.post("/speed",(req,res)=>{

const {speed} = req.body

console.log("Speed:",speed)

if(!activeTrip)
return res.json({error:"no active trip"})

let status="SAFE"

if(speed>110)
status="VIOLATED"
else if(speed>=80)
status="SAFE"
else
status="SAFE"

activeTrip.speed=speed
activeTrip.status=status

io.emit("speedUpdate",{
speed:speed,
status:status
})

res.json({status:"speed received"})

})

/* =====================
Exit C Location
===================== */

app.post("/exit", async(req,res)=>{

console.log("Vehicle Exit")

if(!activeTrip)
return res.json({error:"no active trip"})

const exitTime = new Date()

const exit = new Exit({

vehicle_id:activeTrip.vehicle.vehicle_id,
driver_id:activeTrip.driver.driver_id,
entry_time:activeTrip.entry_time,
exit_time:exitTime,
exit_location_id:"C",
speed:activeTrip.speed,
status:activeTrip.status

})

await exit.save()

io.emit("exitVehicle",{

driver:activeTrip.driver.name,
time:exitTime

})

activeTrip = null

res.json({status:"exit saved"})

})

/* =====================
Server Start
===================== */

server.listen(4000,()=>{
console.log("Server running on port 4000")
})
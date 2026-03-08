const express = require("express")
const mongoose = require("mongoose")
const fs = require("fs")

const app = express()
const PORT = 4000

mongoose.connect("mongodb+srv://iotuser:Iot12345@cluster0.r5gxqyg.mongodb.net/rfid_project")
.then(()=>console.log("MongoDB connected"))
.catch(err=>console.log(err))

const CamSchema = new mongoose.Schema({
image:String,
time:{type:Date,default:Date.now}
})

const Cam = mongoose.model("dashboard_cams",CamSchema)

app.post("/upload", express.raw({type:"image/jpeg",limit:"10mb"}), async(req,res)=>{

try{

const filename = Date.now()+".jpg"

fs.writeFileSync("images/"+filename,req.body)

const data = new Cam({
image:filename
})

await data.save()

console.log("Image saved:",filename)

res.send("OK")

}catch(err){

console.log(err)
res.status(500).send("error")

}

})

app.listen(PORT,()=>{
console.log("Server running on port",PORT)
})
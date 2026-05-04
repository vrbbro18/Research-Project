const express = require("express")
const mongoose = require("mongoose")
const fs = require("fs")

const app = express()

const PORT = 4000


mongoose.connect(
"mongodb+srv://iotuser:Iot12345@cluster0.r5gxqyg.mongodb.net/rfidDB"
)
.then(()=>{
  console.log("MongoDB connected")
})
.catch(err=>{
  console.log(err)
})



if(!fs.existsSync("images"))
{
  fs.mkdirSync("images")
}



const AccidentSchema =
new mongoose.Schema({

  image:String,

  time:{
    type:Date,
    default:Date.now
  },

  sound:Number,

  vibrateFrequency:Number,

  riskLevel:String

},
{
  versionKey:false,

  // IMPORTANT
  collection:"accidents"
})



// IMPORTANT
const Accident =
mongoose.connection.collection(
"accidents"
)



app.post(

"/upload",

express.raw({
type:"image/jpeg",
limit:"10mb"
}),

async(req,res)=>{

try{

const filename =
Date.now()+".jpg"


fs.writeFileSync(
"images/"+filename,
req.body
)


const vibration =
parseInt(
req.headers.vibration
) || 0


const sound =
parseInt(
req.headers.sound
) || 0


let risk = "LOW"


if(vibration >= 40)
{
risk = "HIGH"
}
else if(vibration >= 20)
{
risk = "MEDIUM"
}



const data = {

image:filename,

time:new Date(),

sound:sound,

vibrateFrequency:vibration,

riskLevel:risk

}


await Accident.insertOne(
data
)


console.log(
"Saved to rfidDB.accidents:",
data
)


res.status(200)
.send("OK")

}
catch(err){

console.log(err)

res.status(500)
.send("error")

}

})



app.listen(
PORT,
"0.0.0.0",
()=>{

console.log(
"Server running on port 4000"
)

})
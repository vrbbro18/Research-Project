require("dotenv").config();

const express=require("express");const mongoose=require("mongoose");const http=require("http");const {Server}=require("socket.io");const path=require("path");

const app=express();const server=http.createServer(app);const io=new Server(server);

app.use(express.json());app.use(express.static("public"));

const VEHICLE_UID="BAC1D605";const DISTANCE=0.20;

let currentVehicle=null;let selectedDriver=null;let scannedDrivers=[];

let entryTime=null;let pointATime=null;

let lastSpeed=0;let lastStatus="SAFE";

mongoose.connect(process.env.MONGO_URI).then(()=>{

console.log(
"Mongo Connected"
);

server.listen(
4000,
()=>{

    console.log(
    "Running 4000"
    );

});

}).catch(console.log);

function col(name){return mongoose.connection.db.collection(name);}

app.get("/",(req,res)=>{

res.sendFile(
    path.join(
        __dirname,
        "public",
        "index.html"
    )
);

});

/* ====================================Z VEHICLE==================================== */

app.post("/vehicle-scan",async(req,res)=>{

try{

if(
req.body.uid
!=
VEHICLE_UID
)
{
    return res.json({
        ignored:true
    });
}

currentVehicle=
await col("vehicles")
.findOne({

    rfid_tag_id:
    VEHICLE_UID

});

if(!currentVehicle)
{
    return res
    .status(404)
    .json({
        error:
        "vehicle not found"
    });
}

scannedDrivers=[];
selectedDriver=null;

entryTime=
new Date();

io.emit(
"vehicleEntered",
{

    vehicle_number:
    currentVehicle
    .vehicleNumber

});

console.log(
"Vehicle Loaded"
);

res.json({
    status:
    "vehicle detected"
});

}catch(err){

console.log(err);

res.status(500)
.json({
    error:
    err.message
});

}

});

/* ====================================HUMAN==================================== */

app.post("/human-scan",async(req,res)=>{

try{

const driver=
await col("drivers")
.findOne({

    rfid_tag_id:
    req.body.uid

});

if(!driver)
{
    return res
    .status(404)
    .json({
        error:
        "driver not found"
    });
}

const exists=
scannedDrivers
.find(

    x=>
    x.driverId
    ===
    driver.driverId

);

if(exists)
{
    return res
    .json({

        status:
        "duplicate ignored"

    });
}

scannedDrivers
.push(driver);

io.emit(
"driverScanned",
{

    driver_id:
    driver.driverId,

    name:
    driver.name

});

res.json({
    status:
    "driver added"
});

}catch(err){

console.log(err);

res.status(500)
.json({
    error:
    err.message
});

}

});

/* ====================================SELECT DRIVER==================================== */

app.post("/select-driver",async(req,res)=>{

try{

selectedDriver=
scannedDrivers
.find(

    x=>
    String(
    x.driverId
    )
    ===
    String(
    req.body
    .driver_id
    )

);

if(
!selectedDriver
)
{
    return res
    .status(404)
    .json({
        error:
        "driver not found"
    });
}


await col(
"entries"
)
.insertOne({

    id:
    Date.now(),

    vehicle_id:
    1,

    vehicle_name:
    currentVehicle
    .brand,

    plate:
    currentVehicle
    .vehicleNumber,

    driver_id:
    selectedDriver
    .driverId,

    driver_name:
    selectedDriver
    .name,

    entry_time:
    entryTime,

    entrance_location_id:
    "Z"

});


io.emit(
"driverSelected",
{

    driver:
    selectedDriver

});


console.log(
"ENTRY SAVED"
);

res.json({
    status:
    "selected"
});

}catch(err){

console.log(err);

res.status(500)
.json({
    error:
    err.message
});

}

});

/* ====================================POINT A==================================== */

app.post("/point-a",(req,res)=>{

pointATime=
Date.now();

console.log(
"A scanned"
);

res.json({
    status:
    "A"
});

});

/* ====================================POINT B==================================== */

app.post("/point-b",async(req,res)=>{

try{

    if(!req.body.speed)
    {
        return res.status(400).json({
            error:"speed missing"
        });
    }

    lastSpeed=
    Number(
        req.body.speed
    );

    lastStatus=

    lastSpeed>110

    ?

    "VIOLATED"

    :

    "SAFE";


    await col(
    "speeds"
    )
    .insertOne({

        id:
        Date.now(),

        vehicle_id:
        1,

        driver_id:
        selectedDriver
        .driverId,

        speed:
        lastSpeed,

        status:
        lastStatus

    });


    io.emit(
    "speedUpdate",
    {

        speed:
        lastSpeed

    });


    console.log(
    "SPEED SAVED:",
    lastSpeed
    );

    res.json({
        status:
        "speed saved"
    });

}
catch(err){

    console.log(err);

    res.status(500)
    .json({
        error:
        err.message
    });

}

});

/* ====================================EXIT==================================== */

app.post("/exit",async(req,res)=>{

try{

await col(
"exits"
)
.insertOne({

    id:
    Date.now(),

    vehicle_id:
    1,

    vehicle_name:
    "Mitsubishi",

    plate:
    "PS-1985",

    driver_id:
    selectedDriver
    .driverId,

    driver_name:
    selectedDriver
    .name,

    entry_time:
    entryTime,

    exit_time:
    new Date(),

    exit_location_id:
    "C",

    speed:
    lastSpeed,

    status:
    lastStatus

});


io.emit(
"exitVehicle",
{

    driver:
    selectedDriver
    .name

});


currentVehicle=null;
selectedDriver=null;
scannedDrivers=[];

console.log(
"EXIT SAVED"
);

res.json({
    status:
    "exit saved"
});

}catch(err){

console.log(err);

res.status(500)
.json({
    error:
    err.message
});

}

});
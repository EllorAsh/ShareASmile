import express from "express"
const app = express();

app.get("/sign-up", (req, res)=>{
    res.send("Hello");
});

app.listen(3000,()=>{
    console.log("server running on port 3000");
});
import express from "express";
import bodyparser from "body-parser"
const app = express();

app.use(express.static("./public"));

app.get("/", (req, res)=>{
    res.render("index.ejs")
});

app.post("/sign-up", (req,res)=>{

});

app.listen(3000, ()=>{
    console.log("server started on port 3000");
});
import express from "express"
const app = express();

app.get("/", (req, res)=>{
    res.render("./index.html")
});
app.get("/signup.html", (req, res)=>{
    res.render("./index.html")
});

app.listen(3000,()=>{
    console.log("server running on port 3000");
});
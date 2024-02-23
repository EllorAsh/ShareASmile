import express from "express"
const app = express();

app.get("/sign-up.php", (req, res)=>{
    res.render("index.html")
});

app.listen(3000,()=>{
    console.log("server running on port 3000");
});
import express from "express"
const app = express();

app.get("/", (req, res)=>{
    res.render("./index.html")
});
app.post("/signup", (req, res)=>{
    res.send({ message: 'No blah Found' });
});

app.listen(3000,()=>{
    console.log("server running on port 3000");
});
import express from "express"
import bodyParser from "body-parser";
const app = express();

app.post("/signup", (req, res)=>{
    res.send({ message: 'No blah Found' });
});

app.listen(3000,()=>{
    console.log("server running on port 3000");
});
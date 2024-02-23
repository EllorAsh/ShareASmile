import express from "express"
import {dirname} from "path";
import {fileURLToPath} from "url";
import bodyParser from "body-parser";
const app = express();
const_dirname = dirname(fileURLToPath(import.meta.url))

app.use(bodyParser.urlencoded({extended:true}));

app.post("/signup", (req, res)=>{
    res.send({ message: 'No blah Found' });
});

app.listen(3000,()=>{
    console.log("server running on port 3000");
});
import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
const app = express();
var currentUser;

const db = new pg.Client({
    user:"postgres",
    host:"localhost",
    database:"ShareASmile",
    password:"Ella09088",
    port:"5432",
});
db.connect();

app.use(express.static("./public"));
app.use(bodyParser.urlencoded({extended:true}));

app.get("/", (req, res)=>{
    res.render("index.ejs")
});
app.get("/home", (req, res)=>{
    res.render("home.ejs", {
        userName : currentUser,
    });
})
app.post("/browse", async (req, res)=>{
    const user = req.body["user"];
    const postDb = await db.query("SELECT * FROM posts JOIN users ON users.id = user_id");
    var posts = [];
    postDb.rows.forEach(post => {
        posts.push(post);
    });
    console.log(posts);
    res.render("browse.ejs", {
        userName : currentUser,
        allPosts : posts,
    });
})
app.post("/profile", async (req, res)=>{
    console.log(req.body["ownUser"]);
    const ownUser = req.body["ownUser"];
    const user = req.body["user"];
    console.log(user)
    var posts = [];
    if(ownUser == "true"){
        var result = await db.query("SELECT * FROM users WHERE username=$1",[currentUser])
        var idOfUser = result.rows[0].id;
        const postDb = await db.query("SELECT * FROM posts JOIN users ON users.id = posts.user_id WHERE user_id=$1",[idOfUser]);
        if(postDb.rowCount !== 0){
            postDb.rows.forEach(post => {
                console.log(post);
                posts.push(post);
            });
            res.render("profile.ejs", {
                username : user,
                ownProfile : true,
                sharedPosts : posts,
            })
        }else{
            res.render("profile.ejs", {
                username : user,
                ownProfile : true,
            })
        }

    }else{
        var result = await db.query("SELECT * FROM users WHERE username=$1",[user])
        var idOfUser = result.rows[0].id;
        const postDb = await db.query("SELECT * FROM posts JOIN users ON users.id = posts.user_id WHERE user_id=$1",[idOfUser]);
        if(postDb.rowCount !== 0){
            postDb.rows.forEach(post => {
                console.log(post);
                posts.push(post);
            });
            res.render("profile.ejs", {
                username : user,
                ownProfile : false,
                sharedPosts : posts,
            })
        }else{
            res.render("profile.ejs", {
                username : user,
                ownProfile : false,
            })
        }
    }
});
app.post("/create-smile", (req, res) =>{
    res.render("createSmile.ejs", {
        userName:currentUser,
    });
});
app.post("/createSmile",async (req, res)=>{
    
    if(req.body["userPressed"] === "Share smile"){
        console.log(currentUser);
        console.log("post created !!! :)" + req.body["postContent"])
        const result = await db.query("SELECT id FROM users WHERE username=$1",[currentUser]);
        await db.query("INSERT INTO posts (user_id, content) VALUES($1, $2)",[result.rows[0].id, req.body["postContent"]]);
    }
    res.redirect("/home");
});

app.post("/sign-up", async (req, res) => {
    const username = req.body["username"];
    const password = req.body["password"];

    const result = await db.query("SELECT * FROM users WHERE username=$1",[username]);
    if(result.rowCount !== 0){
        console.log("user already exists!");
        res.redirect("/");
    }else{
        await db.query("INSERT INTO users (username, password) VALUES($1, $2)", [username, password]);
        currentUser = username;
        res.redirect("/home")
    }
});

app.post("/sign-in", async (req, res) => {
    const username = req.body["username"];
    const password = req.body["password"];

    const result = await db.query("SELECT * FROM users WHERE username=$1",[username]);
    if(result.rowCount !== 0){
        const userPassword = await db.query("SELECT password FROM users WHERE username=$1",[username]);
        const actualPassword = userPassword.rows[0].password;
        if(actualPassword === password){
            currentUser = username;
            res.redirect("/home")
        }else{
            console.log("incorrect password!")
            res.redirect("/");
        }
    }else{
        console.log("user does not exist");
        res.redirect("/");
    }
});

app.get("/sign-up-page", (req,res) => {
    res.render("sign-up.ejs");
});

app.get("/sign-in-page", (req,res)=>{
    res.render("sign-in.ejs")
});

app.listen(3000, ()=>{
    console.log("server started on port 3000");
});
app.post("/deleteSmile", async (req, res)=>{
    const postToDeleteId =req.body["idpost"];
    var id = parseInt(postToDeleteId)
    await db.query("DELETE FROM posts WHERE idpost = $1", [id])
    console.log("smile deleted :(");
    res.redirect("/home")
})
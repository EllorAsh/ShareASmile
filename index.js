import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
//new imports
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";
import env from "dotenv";
import GoogleStrategy from "passport-google-oauth2";

const app = express();
var currentUser;
var currentUserName = "user ";

//new
const saltRounds = 10;
env.config();
app.use(
    session({
      resave: false,
      saveUninitialized: true,
    })
  );

//edited
const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});
db.connect();

app.use(express.static("./public"));
app.use(bodyParser.urlencoded({extended:true}));

//new
app.use(passport.initialize());
app.use(passport.session());
app.get("/auth/google", passport.authenticate("google",{
    scope:["profile","email"],
}))
app.get("/auth/google/secrets", passport.authenticate("google", {
    successRedirect: "/home",
    failureRedirect: "/sign-in",
}));

app.get("/", (req, res)=>{
    res.render("index.ejs")
});
app.get("/home", async(req, res)=>{
    const result = await db.query("SELECT * FROM posts JOIN users ON user_id = users.id ORDER BY likes DESC");
    let postToShow =[];
    let posts=[];
    if(result.rowCount !== 0){
        result.rows.forEach(post => {
            postToShow.push(post);
        });
    }
    if(postToShow.length ==1){
        posts.push(postToShow[0])
    }
    if(postToShow.length ==2){
        posts.push(postToShow[0])
        posts.push(postToShow[1])
    }
    if(postToShow.length ==3){
        posts.push(postToShow[0])
        posts.push(postToShow[1])
        posts.push(postToShow[2])
    }
    if(postToShow.length >=4){
        posts.push(postToShow[0])
        posts.push(postToShow[1])
        posts.push(postToShow[2])
        posts.push(postToShow[3])
    }
    console.log(postToShow);
    res.render("home.ejs", {
        posts:posts,
        userName : currentUser,
    });
})
app.get("/browse", async (req, res)=>{
    const postDb = await db.query("SELECT * FROM posts JOIN users ON users.id = user_id");
    var posts = [];
    postDb.rows.forEach(post => {
        posts.push(post);
    });
    res.render("browse.ejs", {
        userName : currentUser,
        allPosts : posts,
    });
})
app.post("/profile", async (req, res)=>{
    var ownUser = req.body["ownUser"];
    const user = req.body["user"];
    const isownuser = await db.query("SELECT * FROM users WHERE username=$1",[user])
    if(isownuser.rows[0].username === currentUser){
        ownUser = "true";
    }
    var posts = [];
    if(ownUser == "true"){
        var result = await db.query("SELECT * FROM users WHERE username=$1",[currentUser])
        var idOfUser = result.rows[0].id;
        var nameOfUser = result.rows[0].name;
        currentUserName = nameOfUser;
        const postDb = await db.query("SELECT * FROM posts JOIN users ON users.id = posts.user_id WHERE user_id=$1",[idOfUser]);
        if(postDb.rowCount !== 0){
            postDb.rows.forEach(post => {
                posts.push(post);
            });
            res.render("profile.ejs", {
                name:nameOfUser,
                username : user,
                ownProfile : true,
                sharedPosts : posts,
            })
        }else{
            res.render("profile.ejs", {
                name:nameOfUser,
                username : user,
                ownProfile : true,
            })
        }

    }else{
        var result = await db.query("SELECT * FROM users WHERE username=$1",[user])
        var idOfUser = result.rows[0].id;
        var nameOfUser = result.rows[0].name;
        currentUserName = nameOfUser;
        const postDb = await db.query("SELECT * FROM posts JOIN users ON users.id = posts.user_id WHERE user_id=$1",[idOfUser]);
        if(postDb.rowCount !== 0){
            postDb.rows.forEach(post => {
                posts.push(post);
            });
            res.render("profile.ejs", {
                name:nameOfUser,
                username : user,
                ownProfile : false,
                sharedPosts : posts,
            })
        }else{
            res.render("profile.ejs", {
                name:nameOfUser,
                username : user,
                ownProfile : false,
            })
        }
    }
});

app.post("/EditProfile",async (req,res)=>{
    res.render("editProfile.ejs",{
        username:currentUser,
    })
})
app.post("/EditProfileSave", async (req, res)=>{
    if(req.body["userPressed"] === "Edit"){
        console.log(req.body);
        const result = await db.query("SELECT * FROM users WHERE username=$1",[req.body["userEmail"]]);
        await db.query("UPDATE users SET name=$1 WHERE username=$2",[req.body["newName"], req.body["userEmail"]]);
    }
    res.redirect("/home");
});

app.post("/create-smile", (req, res) =>{
    res.render("createSmile.ejs", {
        name:currentUserName,
        userName:currentUser,
    });
});
app.post("/createSmile",async (req, res)=>{
    
    if(req.body["userPressed"] === "Share smile"){
        const result = await db.query("SELECT id FROM users WHERE username=$1",[currentUser]);
        await db.query("INSERT INTO posts (user_id, content, likes) VALUES($1, $2, 0)",[result.rows[0].id, req.body["postContent"]]);
    }
    res.redirect("/home");
});
//new
app.post("/sign-up", async (req, res) => {
    const email = req.body.username;
    const password = req.body.password;
  
    try {
      const checkResult = await db.query("SELECT * FROM users WHERE username = $1", [
        email,
      ]);
  
      if (checkResult.rows.length > 0) {
        req.redirect("/sign-in-page");
      } else {
        bcrypt.hash(password, saltRounds, async (err, hash) => {
          if (err) {
            console.error("Error hashing password:", err);
          } else {
            currentUser = email;
            const result = await db.query(
              "INSERT INTO users (username, password, name) VALUES ($1, $2, 'new user') RETURNING *",
              [email, hash]
            );
            const user = result.rows[0];
            req.login(user, (err) => {
              console.log("success");
              res.redirect("/home");
            });
          }
        });
      }
    } catch (err) {
      console.log(err);
    }
  });

//removed

// app.post("/sign-up", async (req, res) => {
//     const username = req.body["username"];
//     const password = req.body["password"];

//     const result = await db.query("SELECT * FROM users WHERE username=$1",[username]);
//     if(result.rowCount !== 0){
//         res.redirect("/");
//     }else{
//         await db.query("INSERT INTO users (username, password) VALUES($1, $2)", [username, password]);
//         currentUser = username;
//         res.redirect("/home")
//     }
// });

//new
app.post("/sign-in", passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/sign-in-page",
}))

passport.use(
    "local",
    new Strategy(async function verify(username, password, cb) {
      try {
        const result = await db.query("SELECT * FROM users WHERE username = $1 ", [
          username,
        ]);
        if (result.rows.length > 0) {
          const user = result.rows[0];
          const storedHashedPassword = user.password;
          bcrypt.compare(password, storedHashedPassword, (err, valid) => {
            if (err) {
              console.error("Error comparing passwords:", err);
              return cb(err);
            } else {
              if (valid) {
                currentUser = username;
                return cb(null, user);
              } else {
                return cb(null, false);
              }
            }
          });
        } else {
          return cb("User not found");
        }
      } catch (err) {
        console.log(err);
      }
    })
  );
  
  passport.use(
    "google",
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
      },
      async (accessToken, refreshToken, profile, cb) => {
        try {
          console.log(profile);
          const result = await db.query("SELECT * FROM users WHERE username = $1", [
            profile.email,
          ]);
          if (result.rows.length === 0) {
            currentUser = profile.email;
            const newUser = await db.query(
              "INSERT INTO users (username, password, name) VALUES ($1, $2, $3)",
              [profile.email, "google", profile.given_name]
            );
            return cb(null, newUser.rows[0]);
          } else {
            currentUser = profile.email;
            return cb(null, result.rows[0]);
          }
        } catch (err) {
          return cb(err);
        }
      }
    )
  );
  passport.serializeUser((user, cb) => {
    cb(null, user);
  });
  
  passport.deserializeUser((user, cb) => {
    cb(null, user);
  });

//removed

// app.post("/sign-in", async (req, res) => {
//     const username = req.body["username"];
//     const password = req.body["password"];

//     const result = await db.query("SELECT * FROM users WHERE username=$1",[username]);
//     if(result.rowCount !== 0){
//         const userPassword = await db.query("SELECT password FROM users WHERE username=$1",[username]);
//         const actualPassword = userPassword.rows[0].password;
//         if(actualPassword === password){
//             currentUser = username;
//             res.redirect("/home")
//         }else{
//             console.log("incorrect password!")
//             res.redirect("/");
//         }
//     }else{
//         console.log("user does not exist");
//         res.redirect("/");
//     }
// });

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
    await db.query("DELETE FROM likes WHERE post_id = $1",[id])
    await db.query("DELETE FROM posts WHERE idpost = $1", [id])
    res.redirect("/home")
})

app.post("/LikeSmile", async (req, res) =>{
    const userThatLiked = req.body["userThatLiked"];
    const postLikedId = req.body["idpost"];
    const result =await db.query("SELECT id FROM users WHERE username = $1",[userThatLiked]);
    const userThatLikedId = result.rows[0].id;
    const currentPost =await db.query("SELECT * FROM posts WHERE idpost = $1",[postLikedId])
    var currentPostLikes = currentPost.rows[0].likes;
    const isLikedByUser =await db.query("SELECT * FROM likes WHERE user_id=$1 AND post_id=$2", [userThatLikedId, postLikedId])
    if(isLikedByUser.rowCount === 0){
        currentPostLikes ++;
        await db.query("INSERT INTO likes(user_id, post_id) VALUES ($1, $2)",[userThatLikedId, postLikedId]);
        await db.query("UPDATE posts SET likes=$1 WHERE idpost = $2",[currentPostLikes, postLikedId])
        console.log(userThatLiked + " with the id of "+ userThatLikedId +" liked a post with the id of "+ postLikedId);
    }else{
        currentPostLikes --;
        await db.query("UPDATE posts SET likes=$1 WHERE idpost = $2",[currentPostLikes, postLikedId])            
        await db.query("DELETE FROM likes WHERE post_id = $1 AND user_id = $2",[postLikedId, userThatLikedId])
        console.log("post already liked");
    }
    console.log(currentPostLikes)
})
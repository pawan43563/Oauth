//jshint esversion:6
require("dotenv").config()
const express=require("express");
const app=express()
const ejs=require("ejs")
const bodyParser=require("body-parser")
const mongoose=require("mongoose")
const session=require("express-session")
const passport=require("passport")
const passportlocalmongoose=require("passport-local-mongoose")
const GoogleStrategy=require("passport-google-oauth20").Strategy
const findOrCreate=require("mongoose-findorcreate")
mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true,useUnifiedTopology: true  })
mongoose.set("useCreateIndex",true);
app.use(express.static("public"))
app.use(session({
    secret:"our little secret",
    resave:false,
    saveUninitialized:false
}))
app.use(passport.initialize())
app.use(passport.session())
app.set("view engine",'ejs')
const userSchema=new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    secret:String
})

userSchema.plugin(passportlocalmongoose)
userSchema.plugin(findOrCreate)
const User=mongoose.model("User",userSchema)
passport.use(User.createStrategy())
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
passport.use(new GoogleStrategy({
    clientID: process.env.ClIENT_ID,
    clientSecret: process.env.ClIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(token, tokenSecret, profile, done) {
      console.log(profile)
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
          
        return done(err, user);
      });
  }
));
app.use(bodyParser.urlencoded({
    extended:true
}))

app.get("/",function(req,res){
    res.render("Home")
})
app.get("/auth/google",function(req,res){
    passport.authenticate("google",{scope:["profile"]})
})
app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/secrets');
  });
app.get("/login",function(req,res){
    res.render("login")
})
app.get("/register",function(req,res){
    res.render("register")
})
app.get("/secrets",function(req,res){
    if(req.isAuthenticated()){
        res.render("secrets")
    }else{
        res.redirect("/login")
    }
})
app.get("/logout",function(req,res){
    req.logout();
    res.redirect("/")
})
app.post("/register",function(req,res){
    User.register({username:req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err)
            res.redirect("/register")
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets")
            })
        }

    })
    
})

app.post("/login",function(req,res){
  const user=new User({
      username:req.body.username,
      password:req.body.password
  })
  req.login(user,function(err){
      if(err){
          console.log(err)
          
      }else{
          passport.authenticate("local")(req,res,function(){
              res.redirect("/secrets")
          })
      }
  })
})
app.listen(3000,function(){
    console.log("Successfully server started at 3000 port")
})
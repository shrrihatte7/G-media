var express = require("express");
var router = express.Router();
const userModel = require("./users");
const postModel = require("./posts");
const passport = require("passport");
const localStrategy = require("passport-local");
const upload = require("./multer");

passport.use(new localStrategy(userModel.authenticate()));


const isLoggedIn = (req,res,next)=>{
  if(req.isAuthenticated()) {
   return next();
  }
  else{
    res.redirect("/");
  }
};
/* GET home page. */
router.get("/", function(req, res, next) {
  res.render("index",{nav:false, error:req.flash("error")});
});

router.get("/register", function(req, res, next) {
  res.render("register",{nav:false});
});

router.post("/register", function(req, res, next) {
  const users  = new userModel({
    username :req.body.username,
    email : req.body.email,
    contact : req.body.contact
  });
  userModel.register(users,req.body.password).then(()=>{
    passport.authenticate("local")(req,res,()=>{
      res.redirect("/profile");
    });
  });
});

router.get("/profile", isLoggedIn, async function(req, res, next) {
 const user =  await userModel
 .findOne({username:req.session.passport.user})
  .populate("posts");
  res.render("profile",{user,nav:true});
});

router.get("/add", isLoggedIn, async function(req, res, next) {
 const user =  await userModel.findOne({username:req.session.passport.user});

  res.render("add",{user,nav:true});
});

router.get("/show/posts", isLoggedIn, async function(req, res, next) {
  const user =  await userModel
 .findOne({username:req.session.passport.user})
  .populate("posts");
  res.render("show",{user,nav:true});
});

router.get("/feed", isLoggedIn, async function(req, res, next) {
  const user =  await userModel.findOne({username:req.session.passport.user})
  const posts = await postModel.find().populate("user");
  
  res.render("feed",{user,posts,nav:true});
});

router.post("/createpost", isLoggedIn,upload.single("postimage"), async function(req, res, next) {
 const user =  await userModel.findOne({username:req.session.passport.user});
  const post = await postModel.create({
    user:user._id,
    title:req.body.title,
    description:req.body.description,
    postimage: req.file.filename
  });
  console.log(post);
  user.posts.push(post._id);
  await user.save();

  res.redirect("/profile");
});



router.post("/fileupload",isLoggedIn, upload.single("image"), async (req,res,next)=>{
 const user =  await userModel.findOne({username:req.session.passport.user});
 user.profileImage = req.file.filename;
 await user.save();
 res.redirect("/profile");
});




router.post("/login", passport.authenticate("local",{
  successRedirect:"/profile",
  failureRedirect:"/",
  failureFlash:true
}), (req, res)=> {});

router.get("/logout",(req,res,next)=>{
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect("/");
  });
});

 
module.exports = router;

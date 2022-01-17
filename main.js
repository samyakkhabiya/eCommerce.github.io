const express = require('express')
const app = express()
const port = 3000
const path = require('path')
const session = require('express-session')
const fs = require('fs')
const mailjet_client = require ('node-mailjet')
const cookieParser = require('cookie-parser');

var mailjet = mailjet_client.connect
('4b4169d4229638018327f815e6196f32', '485f817fc9e6c4fc21d4a095fb47e396')

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'assets')))
app.use(express.static("views"));
app.use(express.urlencoded({extended:true}));
app.use(cookieParser()); 

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}))

var a = [{id: 1, title: "OnePlus", description: "Mobile", image: "1.jpg", stock: 10, price: 30000},
{id: 2, title: "BoatRockerz", description: "Earphone", image: "2.jpg", stock: 20, price: 2000},
{id: 3, title: "AppleWatch", description: "SmartWatch", image: "3.jpg", stock: 30, price: 20000},
{id: 4, title: "DSLR", description: "Camera", image: "4.jpg", stock: 40, price: 50000},
{id: 5, title: "AppleiPad", description: "Tablet", image: "5.jpg", stock: 60, price: 60000},
{id: 6, title: "SanDisk", description: "Pendrive", image: "6.jpg", stock: 80, price: 1000},
{id: 7, title: "Alexa", description: "SmartSpeaker", image: "7.jpg", stock: 20, price: 3000},
{id: 8, title: "MacBook", description: "Laptop", image: "8.jpg", stock: 8, price: 80000},
{id: 9, title: "SonyBravia", description: "LEDTV", image: "9.jpg", stock: 15, price: 40000}]

fs.writeFile("./products.txt", JSON.stringify(a), function(err)
{
    console.log(err)
})

function readProduct(callback)
{
    fs.readFile("./products.txt","utf-8", function(err, data)
    {
        data  = data ? JSON.parse(data) : [];

        callback(data);
    })
}

//home route
app.get('/', (req, res) => {
	//console.log(req.session) //To store or access session data

	if(req.session.is_logged_in){
       // readProduct
        fs.readFile("./products.txt","utf-8",(err_r,f_data) => {
          readCart(function(cart){
            res.render('home',{products : JSON.parse(f_data), cart_items: cart})
          })
        })
	}
	else{
		res.redirect('/login')
	}
})

//login route
app.get('/login', (req, res) =>{
	res.render('login')
})

app.post('/login',function(req,res){
    var flag=0;
    fs.readFile("./data.txt","utf-8",function(error,finaldata){
        finaldata = finaldata.length ? JSON.parse(finaldata) : [];
        //console.log(req.body);
		var account = req.body;
        for(var i = 0; i<finaldata.length; i++){
            if(account.email == finaldata[i].email && account.password == finaldata[i].password){
                flag++;
                req.session.is_logged_in = true;
        //res.cookie("auth", req.signedCookies); //doubt (auth, what to send instead of token)
				res.redirect('/');
            }
        }
        if(flag==0){
            res.render("login",{msg : "User not found"});
        }
    });
});

//signup route
app.get('/signup', (req, res) =>{
	res.render('signup')
})

app.post('/signup', (req, res) =>{
    console.log(req.body);
   
    var user =req.body;
	fs.readFile('./data.txt', 'utf8' , (err, data) => {
		file_data = data ? JSON.parse(data) : [];

		var flag = 0;
		for(var i=0;i<file_data.length;i++){
			if(file_data.email == user.email){
				flag = 1;
				res.send('User already registered')
				break;
			}
		}
		if(flag == 0){
      user.is_verified = false;
      user.verification_key = "hithisisthekey";
			file_data.push(user);
			console.log(file_data);

      sendVerificationMail("hithisisthekey", user.email, user.username);

	    fs.writeFile('./data.txt', JSON.stringify(file_data), (err,data) => {
        if (err) {
          res.render('signup', {msg: "Error while creating user"})
        }
        else{
          //res.cookie("auth", req.signedCookies); //doubt
          res.render('signup', {msg: "A Verification email has been sent.Please check your inbox!"})
        }
              //file written successfully
        })
		}
    })
})


//logout route
app.get('/logout',(req,res) => {
    req.session.destroy((err) => {
        if(err) {
            return console.log(err);
        }
        res.redirect('/');
    });

});

//verify account route
app.get('/verify_account', (req,res) =>{
  var key = req.query.verification_key;
    
        fs.readFile("./data.txt","utf-8", (err,f_data)=> 
        {
            f_data=JSON.parse(f_data);
            for(var i=0;i<f_data.length;i++)
            {
                if(f_data[i].verification_key == key)
                {
                    f_data[i].is_verified =true;
                    break;
                }
            }
            fs.writeFile("./data.txt",JSON.stringify(f_data), (err_r,data) =>
            {
                res.render('login', {msg: "Your account has been verified.You can login now!"})
            })
           
        })
})

function sendVerificationMail(key, customerEmail, customerName){
const request = mailjet
.post("send", {'version': 'v3.1'})
.request({
  "Messages":[
    {
      "From": {
        "Email": "samyakkhabiya123@gmail.com",
        "Name": "samyak"
      },
      "To": [
        {
          "Email": customerEmail,
          "Name": customerName
        }
      ],
      "Subject": "Greetings from ClickNBuy.",
      "TextPart": "My first Mailjet email",
      "HTMLPart": "<h3>Dear "+customerName+", <br>Welcome to ClickNBuy ! <br>You're just one click away from completing the sign-up process.<br><a href='https://final-3p34g85s1mkqwqxjgp.codequotient.in/verify_account?verification_key="+key+"'>Verify your account</a></h3><br />Happy Shopping at ClickNBuy :)<br>Regards<br>Aditi Sharma",
      "CustomID": "AppGettingStartedTest"
    }
  ]
})
request
  .then((result) => {
    console.log(result.body)
  })
  .catch((err) => {
    console.log(err.statusCode)
  })
}

//forgot password route
app.get('/forgot', (req, res) =>{
  res.render('forgotpassword')
})

app.post('/forgot', (req, res) =>{
  var email = req.body.email;
  
  fs.readFile("./data.txt","utf-8",(err_r,f_data) =>
    {
        f_data =JSON.parse(f_data);
          
        var flag = 0;  
        for(var i=0;i<f_data.length;i++)
        {
            if(f_data[i].email == email)
            {
                flag = 1;

                sendResetMail(f_data[i].verification_key,email,f_data[i].username);
                 res.render("forgotpassword",{msg:"Email sent"});
                break;
            }
        }
        if(flag == 0)
            res.render("forgotpassword",{msg :"Email not registered"});  
       
    });

})

function sendResetMail(key, customerEmail, customerName){
const request = mailjet
.post("send", {'version': 'v3.1'})
.request({
  "Messages":[
    {
      "From": {
        "Email": "aditiadisharma2@gmail.com",
        "Name": "Aditi"
      },
      "To": [
        {
          "Email": customerEmail,
          "Name": customerName
        }
      ],
      "Subject": "ClickNBuy - Forgot Password",
      "TextPart": "My first Mailjet email",
      "HTMLPart": "<h3>Hello "+customerName+", <br>Forgot your password? <br>No problem, let us get you a new one.<br><a href='https://final-3p34g85s1mkqwqxjgp.codequotient.in/change_password?verification_key="+key+"'>Reset Password</a></h3><br />P.S. If you did not make this request, you may ignore it<br>Happy Shopping at ClickNBuy :)<br>Regards<br>Aditi Sharma.",
      "CustomID": "AppGettingStartedTest"
    }
  ]
})
request
  .then((result) => {
    console.log(result.body)
  })
  .catch((err) => {
    console.log(err.statusCode)
  })
}

//change_password
app.get('/change_password', (req,res) =>{
  res.render('changepassword')
})

app.post('/change_password', (req,res) =>{
    
    var password=req.body.password;
    var key= req.body.key;
    console.log(key);

    fs.readFile("./data.txt","utf-8", (err,f_data) => {
        f_data= JSON.parse(f_data);
        for(var i=0;i<f_data.length;i++)
        {
            if(f_data[i].verification_key== key)
            {
                f_data[i].password = password;
                break;
            }
        }
        fs.writeFile("./data.txt",JSON.stringify(f_data), (err, data) =>
        {
           // res.redirect("/login");
           if(err)
                console.log(err);
            else
                res.render("changepassword",{msg:"Password changed"});
        })

    })

    //    
})

function readCart(callback){
  fs.readFile('./cart.txt', 'utf-8' , (err, data) => {
		data = data ? JSON.parse(data) : {};  //object
    callback(data);
    })
}

function saveToCart(data, callback){
  fs.writeFile('./cart.txt', JSON.stringify(data), function(err){
    callback(err)
  })
}

//addToCart route
app.get('/add_to_cart', (req,res) =>{
  var product_id = req.query.id;

  fs.readFile("./products.txt","utf-8",(err_r,f_data) => {
    readCart(function(cart){
      console.log(cart)
      cart[product_id] = true;

      saveToCart(cart, function(){
        res.render('home',{products : JSON.parse(f_data), cart_items: cart})
      })

    })
  })
})

//my cart 
app.get('/my_cart', (req,res) =>{
    readProduct(function(products){
    readCart(function(cart){
      var cart_items = [];
      for(var key in cart){
        var filtered_product = products.find(function(product){
          return key == product.id;
        })
        if(filtered_product){
          cart_items.push(filtered_product)
        }
      }
      res.render('cart',{products : cart_items})
    })
})
})


app.listen(process.env.PORT || port, () => {
	console.log(`Example app listening at http://localhost:${port}`)
})


// app.listen(process.env.PORT || 3000, function(){
//   console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
// });

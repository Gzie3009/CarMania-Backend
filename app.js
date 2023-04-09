const express=require("express")
const mongoose = require("mongoose")
const emailValidator =require("email-validator")
const jwt= require("jsonwebtoken")
const JWT_KEY="abcdefghijklmnopqrstuvwxyz"
const cookieParser=require("cookie-parser")
const bodyParser=require("body-parser")
const cors=require("cors")
const bcrypt=require("bcrypt")
const dotenv=require("dotenv");
dotenv.config({path: "./config.env"});
const app= express()

const allowedOrigins = ['http://localhost:3000', 'https://carmania123.netlify.app'];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use(cors(corsOptions));

  
  app.use(express.json())
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cookieParser());



mongoose.connect(process.env.DB).then(
    function(){
        console.log("db connected")
    }
).catch((e)=>{
    console.log(e)
})



const userSchema=mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        validate:function(){
            return(emailValidator.validate(this.email))
        }
    },
    phone:{
        type:Number,
        required:true,
    },
    password:{
        type:String,
        required:true,
        minlength:8
    },
    confirmPassword:{
        type:String,
        required:true,
        minlength:8,
        validate:function(){
            return(emailValidator.validate(this.email))
        }
    }
})

userSchema.pre("save",async function(){
    this.confirmPassword=undefined;
        let salt=await bcrypt.genSalt()
        const hash=bcrypt.hashSync(this.password, salt);
        this.password=hash;
})

const paymentSchema=mongoose.Schema({
    cardNo:{
        type:String,
        require:true
    },
    holderName:{
        type:String,
        require:true
    },
    mm:{
        type:String,
        require:true
    },
    yy:{
        type:String,
        require:true
    },
    cvv:{
        type:String,
        require:true,
        minlength:3
    }
})

const checkoutSchema=mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true,
        validate:function(){
            return(emailValidator.validate(this.email))
        }
    },
    fname:{
        type:String,
        required:true,
    },
    phone:{
        type:String,
        required:true,
    },
    address:{
        type:String,
        required:true,
    },
    zipcode:{
        type:String,
        required:true,
        minlength:6
    },
    start:{
        type:String,
        required:true,
    },
    end:{
        type:String,
        required:true,
    },
    Cost:{
        type:Number,
        required:true,
    }
})

const contactSchema=mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
    },
    phone:{
        type:Number,
        required:true,
    },
    message:{
        type:String,
        required:true
    }
})


const contactModel=mongoose.model("contactModel",contactSchema)
const checkoutModel=mongoose.model("checkoutModel",checkoutSchema)
const paymentModel=mongoose.model("paymentModel",paymentSchema)
const userModel=mongoose.model("userModel",userSchema)




const userRouter=express.Router();
app.use("/users",userRouter)

userRouter
.route("/register")
.post(signup)


async function signup(req,res){
    try{
    const user =await userModel.create(req.body);
    console.log(user)
    if(user){
        res.status(200).json({
            message:"success",
            status:200
        })
    }
}catch(e){
    res.json({
        message:e.message
    })
}
}


userRouter
.route("/signin")
.post(login)

async function login(req,res){
    try{
    if(req.body.email){
    let user= await userModel.findOne({email:req.body.email});
    if(user){
         bcrypt.compare(req.body.password, user.password, function(err, result) {
            if(result){
                const uid=user._id;
                const token= jwt.sign({payload:uid},JWT_KEY)
                res.status(200).json({
                    message:"user logged in successfully",
                    status:200,
                    token:token,
                    email:user.email
                })

            }
            if(err){
                res.status(400).json({
                    message:"invalid credentials"
                })
            }
        });
    }else{
        res.status(401).json({
            message:"user not found"
        })
    }
}else{
    res.status(300).json({
        message:"please fill the empty fields"
    })
}
    }
    catch(e){
        res.json({
            message:e.message
        })
    }

}
userRouter
.route("/contactus")
.post(contactus)

async function contactus(req,res){
    try{
        if((req.body.email || req.body.phone) && req.body.message){
            const message=await contactModel.create(req.body)
            if(message){
                res.json({
                    message:"message sent successfully",
                    status:200
                })
            }
        }

    }catch(e){
        res.json({
            message:e.message,
            status:e.status
        })
    }
}

app.get("/",function(req,res){
    res.send("hello from backend")
})

userRouter.route("/payment")
.post(payment)

async function payment(req,res){
    try{
    if(req.body){
        const data=await paymentModel.create(req.body);
        if(data){
            res.json({
                message:"Payment Successfull",
                status:200
            })
        }else{
            res.json({
                message:"unsucessfull payment",
                status:404
            })
        }
    }
    else{
        res.json({
            message:"Invalid Credentials"
        })
    }

}catch(e){
    res.json({
        message:e.message
    })
}
}


userRouter.route("/checkout")
.post(checkout)

async function checkout(req,res){
    try{
    if(req.body){
        const data=await checkoutModel.create(req.body);
        if(data){
            res.json({
                message:"checkout Successfull",
                status:200
            })
        }else{
            res.json({
                message:"checkout unsuccessfull",
                status:404
            })
        }
    }
    else{
        res.json({
            message:"Invalid Credentials"
        })
    }

}catch(e){
    res.json({
        message:e.message
    })
}
}

app.listen(process.env.PORT||3010,()=>{console.log(`listening on port localhost:${3010}`)})
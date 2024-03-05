import mongoose,{Schema} from "mongoose";
import Jwt  from "jsonwebtoken";
import bcrypt from "bcrypt"

const userSchema= new Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            
        },
        fullName:{
            type:String,
            required:true,
            trim:true,
            index:true
        },
        avatar:{
            type:String, // cloudinary url
            required:true,
        },
        coverImage:{
           type:String,
           
        },
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password:{
            type:String,
            required:[true,'Password is required']
        },
        refreshToken:{
            type:String
        }

    },{timestamps: true}
)

// Execute this function before saving a user instance
userSchema.pre("save", async function (next) {
    // Check if the password field is not modified
    if (!this.isModified("password")) {
        // If password is not modified, proceed to the next middleware
        return next();
    }

    // Hash the password asynchronously using bcrypt with a cost factor of 10
    this.password = await bcrypt.hash(this.password, 10);

    // Proceed to the next middleware
    next();
});


userSchema.methods.isPasswordCorrect = async function (password){
  return  await  bcrypt.compare(password, this.password)
}

// Define a method called generateAccessToken for the user schema
userSchema.methods.generateAccessToken = function () {
    // Generate a JSON Web Token (JWT) containing user information
    return Jwt.sign(
        // Payload of the JWT containing user information
        {
            _id: this._id, // User's ID
            email: this.email, // User's email
            username: this.username, // User's username
            fullName: this.fullName // User's full name
        },
        // Secret key used to sign the JWT, retrieved from environment variables
        process.env.ACCESS_TOKEN_SECRET,
        {
            // Additional options for the JWT, such as expiration time
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY // Expiration time for the token
        }
    );
}

userSchema.methods.generateRefreshToken= function (){
    return  Jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY

        }
    )
}

export const User=mongoose.model("User",userSchema)
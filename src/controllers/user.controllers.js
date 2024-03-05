import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"


const registerUser= asyncHandler ( async (req,res) =>{
     //get user details from frontend
     // validation - not empty
     //check if user already exist: username,email
     //check for images, check for avatar
     // upload them to cloudinary , avatar
     // create user object - create entry in db
     // remove password and refresh token field from response
     // check for user creation
     // return response

     const {fullName,email,username,password }= req.body;
    // you can also check only if else condition for every field
     if(
        [fullName,email,username,password].some( (field)=> field?.trim()==="")
     ){
        throw new ApiError(400,"All fields are required")
     }

     //const existedUser= User.findOne(email);
     //or
     const existedUser = User.findOne({
        $or : [{ username },{ email }]
     })

     if(existedUser){
        throw new ApiError(409,"User with username and email already exist")
     }
     //multer gives the files access
     const avatarLoaclPath = req.files?.avatar[0]?.path;
     const coverImageLocalPath = req.files?.coverImage[0]?.path;

     if(!avatarLoaclPath){
        throw new ApiError(400,"Avatar file is required")
     }

    const avatar= await uploadOnCloudinary(avatarLoaclPath)
    const coverImage =await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

   const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })
    //read this syntax

   const createdUser = await User.findById(user._id).select(
    "-password -refershToken"
   )

   if(!createdUser){
    throw new ApiError(500,"Something went wrong")
   }
   return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered successfully")
   )

})

export {registerUser}
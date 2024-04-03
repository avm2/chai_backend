import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import Jwt  from "jsonwebtoken"


const generateAccessAndRefreshToken =async(userId) =>{
   try{
      const user= await User.findById(userId)
      
     const accessToken= user.generateAccessToken()
     const refreshToken= user.generateRefreshToken()

     // value add in object
     user.refreshToken=refreshToken
     await user.save({validateBeforeSave: false})

     return {accessToken,refreshToken}

     

   }catch(error){
      throw new ApiError(500,"Something went wrong while generating referesh and access token")
   }
}


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
     const existedUser =await User.findOne({
        $or : [{ username },{ email }]
     })

     if(existedUser){
        throw new ApiError(409,"User with username and email already exist")
     }
     //multer gives the files access
     const avatarLocalPath = req.files?.avatar[0]?.path;
     //const coverImageLocalPath = req.files?.coverImage[0]?.path;

     let coverImageLocalPath;
     if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImageLocalPath.length >0){
      coverImageLocalPath= req.files.coverImage[0].path
     }

     if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
     }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;


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
    "-password -refreshToken"
   )

   if(!createdUser){
    throw new ApiError(500,"Something went wrong")
   }
   return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered successfully")
   )

})

// login user
const loginUser = asyncHandler( async (req,res) =>{
   //req body ->data
   // username or email
   // find the user
   // password check
   //access and referesh token
   // send cookies

   const  {email,username,password} = req.body

   if(!(username || email)){
      throw new ApiError(400,"username or email is required")
   }

   const user = await User.findOne({
      $or: [{username}, {email}]
   })

   if(!user){
      throw new ApiError(404,"user does not exist")
   }

   const isPasswordValid=await user.isPasswordCorrect(password)

   if(!isPasswordValid){
      throw new ApiError(401,"Invalid password")
   }

  const {accessToken,refreshToken} = await  generateAccessAndRefreshToken(user._id)
 
  const loggedinUser=await User.findById(user._id).select("-password -refereshToekn")

  // securtiy steps, cookies not modified by frontend
  const options = {
   httpOnly :true,
   secure: true
  }

  return res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
   new ApiResponse(
      200,
      {
         user: loggedinUser,accessToken,refreshToken
      },
      "User logged In successfully"
   )
  )
})

//logout user

const logOutUser= asyncHandler( async(req,res) =>{
  await  User.findByIdAndUpdate(
      req.user._id,
      {
         $set: {
            refreshToken: undefined
         }
      },
      {
         new: true
      }
   )

   const options = {
      httpOnly :true,
      secure: true
     }
   return res
   .status(200)
   .clearCookie("accessToken",options)
   .clearCookie("refreshToken",options)
   .json(new ApiResponse(200,{}, "user logged out"))
})

const refreshAccesstoken = asyncHandler( async(req,res) =>{
   const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshToken
   if(!incomingRefreshToken){
      throw new ApiError(401,"unauthorized request")
   }

  try {
   const decodedToken= Jwt.verify(
       incomingRefreshToken,
       process.env.REFRESH_TOKEN_SECRET
    )
 
   const user=await User.findById(decodedToken?._id)
 
   if(!user){
    throw  new ApiError(401,"Invalid refresh token")
   }
 
   if(incomingRefreshToken!==user?.refreshToken){
    throw  new ApiError(401,"Refresh token expired")
   }
 
   const options ={
    httpOnly:true,
    secure:true
   }
 
   const{accessToken,newRefreshToken}=await generateAccessAndRefreshToken(user._id)
 
   return res
   .status(200)
   .cookie("accessToken", accessToken,options)
   .cookie("refreshToken",newRefreshToken,options)
   .json(
    new ApiResponse(
       200,
       {accessToken,newrefreshToken:newRefreshToken},
       "Access token refreshed"
    )
   )
 
  } catch (error) {
   throw new ApiError(401, error?.message || "invalid refreshtoken")
  }
   
})


const changeCurrentPassword = asyncHandler(async(req,res) =>{

   const {oldPassword, newPassword} =req.body

   const user= await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
      throw new ApiError(400,"Invalid old password")
    }

    user.password =  newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password changes Successfully"))

})

const getCurrentUser = asyncHandler(async(req,res) =>{
   return res
   .status(200)
   .json(200,req.user,"current user fetched successfully")
})

const updateAccountDetails= asyncHandler( async(req,res) =>{
    const {fullName,email} = req.body

    if(!fullName || !email){
      throw new ApiError(400,"All field are required")
    }

    const user= User.findByIdAndUpdate(
      req.user?._id,
      {
         $set:{
            fullName:fullName,
            email:email
         }
      },
      {new:true}
    ).select("-password")


    return res
    .status(200)
    .json(new ApiResponse(200,user, "Account details updated successfully"))
    
      
})

const updateUserAvatar= asyncHandler(async(req,res)=>{

  const avatarLocalPath= req.file?.path

  if(!avatarLocalPath){
   throw new ApiError(400,"Avatar file is missing")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if(!avatar.url){
   throw new ApiError(400,"Error while uploading on avatar")
  }

  const user = await User.findByIdAndUpdate(
   req.user?._id,
   {
      $set:{
         avatar:avatar.url
      }
   },
   {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200,user,"avatar  uploaded" ))

})


const updateUserCoverImage= asyncHandler(async(req,res)=>{

   const coverImageLocalPath= req.file?.path
 
   if(! coverImageLocalPath){
    throw new ApiError(400,"Cover Image file is missing")
   }
 
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)
 
   if(!coverImage.url){
    throw new ApiError(400,"Error while uploading on Image")
   }
 
  const user=  await User.findByIdAndUpdate(
    req.user?._id,
    {
       $set:{
          coverImage: coverImage.url
       }
    },
    {new: true}
   ).select("-password")

   return res
   .status(200)
   .json(new ApiResponse(200,user,"cover Image uploaded" ))
 
 
 })

export {
   registerUser,
   loginUser,
   logOutUser,
   refreshAccesstoken,
   getCurrentUser,
   changeCurrentPassword,
   updateAccountDetails,
   updateUserAvatar,
   updateUserCoverImage

}
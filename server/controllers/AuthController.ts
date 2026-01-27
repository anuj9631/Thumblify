import { Request, Response } from "express"
import User from '../models/User.js'
import bcrypt from 'bcrypt'

//controller function for user registration

export const registerUser = async (req: Request, res:Response) => {
  try {
    const {name, email, password}= req.body;

    //find by email
    const user = await User.findOne({email});
    if(user){
      return res.status(400).json({message: 'User already exists'})
    }

    const salt= await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password,salt)

    const newUser= new User({name, email, password: hashedPassword})
    await newUser.save()

    //setting user data in sesssin 
    req.session.isLoggedIn = true;
    req.session.userId = newUser._id;

    return res.json({
      message: 'Account created successfully',
      user:{
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    })

  } catch (error: any) {
    console.log(error);
    res.status(500).json({message: error.message})
  }
}
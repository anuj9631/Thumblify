
import { Request, Response } from "express"
import Thumbnail from "../models/Thumbnail.js";
// cotrollers to get all user thumbnails 

export const getUsersThumbnails = async (req: Request, res: Response) => {
  try {
    
    const {userId} = req.session;

    const thumbnail = await Thumbnail.find({userId}).sort({createdAt: -1})
    res.json({thumbnail})

  } catch (error: any) {
    console.log(error);
    res.json(500).json({message: error.message});
  }
}

// cotrollers to get a single user thumbnails 


export const getThumbnailbyId = async (req: Request, res: Response) => {
  try {
    
    const {userId} = req.session;
    const {id} = req.params;


    const thumbnail = await Thumbnail.findOne({userId, _id: id});
    res.json({thumbnail})

  } catch (error: any) {
    console.log(error);
    res.json(500).json({message: error.message});
  }
}

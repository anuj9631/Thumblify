import { Request, Response } from "express"
import Thumbnail from "../models/Thumbnail.js";

export const getUsersThumbnails = async (req: Request, res: Response) => {
  try {
    const {userId} = req.session as any;
    const thumbnail = await Thumbnail.find({userId}).sort({createdAt: -1})
    res.json({thumbnail})
  } catch (error: any) {
    console.log(error);
    // Fixed: Changed res.json(500) to res.status(500)
    res.status(500).json({message: error.message});
  }
}

export const getThumbnailbyId = async (req: Request, res: Response) => {
  try {
    const {userId} = req.session as any;
    const {id} = req.params;
    const thumbnail = await Thumbnail.findOne({userId, _id: id});
    res.json({thumbnail})
  } catch (error: any) {
    console.log(error);
    // Fixed: Changed res.json(500) to res.status(500)
    res.status(500).json({message: error.message});
  }
}
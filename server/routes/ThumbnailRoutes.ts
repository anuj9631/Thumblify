import express from "express";
import { deleteThumbnail, generateThumbnail } from "../controllers/ThumbnailControllers.js";

const ThumbnailRouter = express.Router();

ThumbnailRouter.post('/generate', generateThumbnail);
ThumbnailRouter.delete('/delete/:id', deleteThumbnail); // Fixed from i:id

export default ThumbnailRouter;
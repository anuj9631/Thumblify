import  express  from "express";
import { deleteThumbnail, generateThumbnail } from "../controllers/ThumbnailControllers.js";

const ThumbnailRouter = express.Router();

ThumbnailRouter.post('/generate', generateThumbnail)
ThumbnailRouter.delete('/delete/i:id', deleteThumbnail)

export default ThumbnailRouter;

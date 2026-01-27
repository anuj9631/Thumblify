import mongoose from "mongoose";

export interface Iuser extends Document {
    name: string;
    email: string;
    password?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const UserSchema = new mongoose.Schema<Iuser>({
  name: {type: String, required: true, trim: true},
  email: {type: String, required: true, trim: true, unique: true, lowercase: true},

},{timestamps: true})

const User = mongoose.models.User || mongoose.model<Iuser>('User',UserSchema)

export default User;
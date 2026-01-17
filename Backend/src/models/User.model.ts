import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  phoneNumber: string;
  password: string;
  name?: string;
  gender?: string;
  location?: string;
  bodyType?: string;
  height?: string;
  goToStyle?: string;
  userPic?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long']
    },
    name: {
      type: String,
      trim: true
    },
    gender: {
      type: String,
      trim: true,
      enum: ['Male', 'Female', 'Other']
    },
    location: {
      type: String,
      trim: true
    },
    bodyType: {
      type: String,
      trim: true
    },
    height: {
      type: String,
      trim: true
    },
    goToStyle: {
      type: String,
      trim: true
    },
    userPic: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    collection: 'users'
  }
);

// Index for faster queries
UserSchema.index({ phoneNumber: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);

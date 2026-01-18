import mongoose, { Document, Schema } from "mongoose";

export interface IProfile extends Document {
  user_id: mongoose.Types.ObjectId;
  name: string | null;
  gender: string | null;
  weather_preference: number | null;
  lifestyle: string | null;
  body_type: string | null;
  height: number | null;
  skin_tone: number | null;
  preferred_styles: string[];
  photo_url: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const ProfileSchema = new Schema<IProfile>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      default: null,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", null],
      default: null,
    },
    weather_preference: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    lifestyle: {
      type: String,
      enum: ["formal", "casual", "athletic", null],
      default: null,
    },
    body_type: {
      type: String,
      enum: ["slim", "athletic", "average", "muscular", "curvy", "plus", null],
      default: null,
    },
    height: {
      type: Number,
      min: 100,
      max: 250,
      default: null,
    },
    skin_tone: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    preferred_styles: {
      type: [String],
      default: [],
    },
    photo_url: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Profile = mongoose.model<IProfile>("Profile", ProfileSchema);

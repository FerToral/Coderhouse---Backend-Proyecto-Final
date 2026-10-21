import { Schema, model } from "mongoose";

const msgSchema = new Schema({
  user: { type: String, required: true, maxlength: 254 },
  message: { type: String, required: true, maxlength: 1000 },
});

export const MsgModel = model("messages", msgSchema);

import { Schema, model } from "mongoose";

const RecoverTokensSchema = new Schema({
    email: { type: String, required: true },
    token: { type: String, required: true },
    expire: { type: String, required: true },
  });


export const RecoverTokensModel = model("recoverTokens", RecoverTokensSchema);


import { Schema, model } from "mongoose";

const RecoverTokensSchema = new Schema({
  email: { type: String, required: true },
  token: { type: String, required: true },
  expire: { type: Date, required: true, index: { expires: 0 } },
});

export const RecoverTokensModel = model("recoverTokens", RecoverTokensSchema);

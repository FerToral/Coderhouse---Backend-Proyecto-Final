import { RecoverTokensModel } from "../models/recover-tokens.model.js";
class RecoverTokensDAO {
  create(data) {
    return RecoverTokensModel.create(data);
  }
  findOne(query) {
    return RecoverTokensModel.findOne(query);
  }
  updateOne(query, update) {
    return RecoverTokensModel.findOneAndUpdate(query, update, { new: true });
  }
}
export default new RecoverTokensDAO();

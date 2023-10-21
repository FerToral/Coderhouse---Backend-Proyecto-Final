import RecoverTokensMongoose from "../DAO/mongo/models/recover-tokens.mongoose.js";

class RecoverTokensDAO {
  async create(data) {
    try {
      const token = new RecoverTokensMongoose(data);
      const savedToken = await token.save();
      return savedToken;
    } catch (error) {
      throw error;
    }
  }

  async findOne(query) {
    try {
      const foundToken = await RecoverTokensMongoose.findOne(query);
      return foundToken;
    } catch (error) {
      throw error;
    }
  }

  async updateOne(query, update) {
    try {
      const updatedToken = await RecoverTokensMongoose.findOneAndUpdate(query, update, { new: true });
      return updatedToken;
    } catch (error) {
      throw error;
    }
  }

}

const recoverTokensDAO = new RecoverTokensDAO();

export default recoverTokensDAO;

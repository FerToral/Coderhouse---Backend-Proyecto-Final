//@ts-check
import enviroment from "../config/config.js";
import { connectMongo } from "../utils/connect-db.js";

export let userDao;
export let productDao;
export let cartDao;
export let chatDao;
export let recoverTokensDao;

switch(enviroment.persistence){
    case "MONGO":
        connectMongo();
        const {default:UsersMongo} = await import('./mongo/users.mongo.js');
        userDao = UsersMongo;

        const {default:ProductsMongo} = await import('./mongo/products.mongo.js');
        productDao = ProductsMongo;

        const {default:CartsMongo} = await import('./mongo/carts.mongo.js');
        cartDao = CartsMongo;

        const {default:ChatsMongo} = await import('./mongo/chats.mongo.js');
        chatDao = ChatsMongo;
        
        const {default:recoverTokens} = await import('./mongo/chats.mongo.js');
        recoverTokensDao = recoverTokens;
        
        break;
    
    case "MEMORY":
        const {default:UsersMemory} = await import('./memory/users.memory.js');
        userDao = UsersMemory;
        break;
}
import express from 'express';
import { userController } from '../../controllers/users.controller.js';

export const usersHtmlRouter = express.Router();


usersHtmlRouter.get('/', userController.getUsersPagination);

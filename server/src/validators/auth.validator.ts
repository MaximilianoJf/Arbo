import { body, param } from 'express-validator';
import User from '../models/User.model';

export const loginValidator = [
    body('email').notEmpty().withMessage('The email is required').isEmail().withMessage('The format must be an email'),
    body('password').notEmpty().withMessage('The password is required'),
]

export const registerValidator = [
    body('name').notEmpty().withMessage('The name is required'),
    body('email').notEmpty().withMessage('The email is required').isEmail().withMessage('The format must be an email'),
    body('password').notEmpty().withMessage('The password is required'),
]
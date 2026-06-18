import { body, param } from 'express-validator';


export const createUserValidator = [
    body('name').notEmpty().withMessage('The name is required'),
    body('email').notEmpty().withMessage('The email is required').isEmail().withMessage('The format must be an email'),
    body('password').notEmpty().withMessage('The password is required').custom((value) => value.length > 6).withMessage('The password must have at least 6 characters'),
]

export const getUserByIdValidator = [
    param('id').isInt().withMessage('The id must be an integer')

]

export const updateUserByIdValidator = [
    param('id').isInt().withMessage('The id must be an integer'),
    body('name').notEmpty().withMessage('The name is required'),
    body('email').notEmpty().withMessage('The email is required').isEmail().withMessage('The format must be an email'),
    body('password').notEmpty().withMessage('The password is required').custom((value) => value.length > 6).withMessage('The password must have at least 6 characters'),
    body('type').notEmpty().withMessage('The type is required').notEmpty().withMessage('The type is required').isIn(['company', 'user']).withMessage('The type must be "company" or "user"'),
]


export const updateUserTypeByIdValidator = [
    param('id').isInt().withMessage('The id must be an integer'),
    body('role_id').isInt().withMessage('The role_id must be an integer')
]

export const deleteUserByIdValidator = [
    param('id').isInt().withMessage('The id must be an integer')
]
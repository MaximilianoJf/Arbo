import { body, param } from 'express-validator';

export const createOwnervalidator = [
    body('name').notEmpty().withMessage('The name is required'),
    body('email').notEmpty().withMessage('The email is required').isEmail().withMessage('The format must be an email'),
    body('password').notEmpty().withMessage('The password is required').custom((value) => value.length > 6).withMessage('The password must have at least 6 characters'),
]

export const getOwnerByIdValidator = [
    param('id').isInt().withMessage('The id must be an integer')

]

export const updateOwnerByIdValidator = [
    param('id').isInt().withMessage('The id must be an integer'),
    body('name').notEmpty().withMessage('The name is required'),
    body('email').notEmpty().withMessage('The email is required').isEmail().withMessage('The format must be an email'),
    body('password').notEmpty().withMessage('The password is required').custom((value) => value.length > 6).withMessage('The password must have at least 6 characters'),
    body('type').notEmpty().withMessage('The type is required').notEmpty().withMessage('The type is required').isIn(['company', 'user']).withMessage('The type must be "company" or "user"'),
]


export const updateTypeOwnerByIdValidator = [
    param('id').isInt().withMessage('The id must be an integer'),
    body('role_id').isInt().withMessage('The role_id must be an integer')
]

export const deleteOwnerByIdValidator = [
    param('id').isInt().withMessage('The id must be an integer')
]
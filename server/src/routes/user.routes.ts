import { Router } from "express";
import { createUser, getUserById, getUsers, updateUserById, updateTypeUserById, deleteUserById } from "../handlers/user.handler";
import { createUserValidator, deleteUserByIdValidator, getUserByIdValidator, updateUserByIdValidator, updateUserTypeByIdValidator } from "../validators/user.validator";
import { handleInpputErrors } from "../middleware";
const router = Router();

router.get('/', getUsers);

router.get('/:id',
    getUserByIdValidator,
    handleInpputErrors,
    getUserById);

router.post('/',
    createUserValidator,
    handleInpputErrors,
    createUser);

router.put('/:id',
    updateUserByIdValidator,
    handleInpputErrors,
    updateUserById);

router.patch('/:id',
    updateUserTypeByIdValidator,
    handleInpputErrors,
    updateTypeUserById);

router.delete('/:id',
    deleteUserByIdValidator,
    handleInpputErrors,
    deleteUserById);

export default router
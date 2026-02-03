import { Router } from "express";
import { createOwner, getOwnerById, getOwners, updateOwnerById, updateTypeOwnerById, deleteOwnerById } from "../handlers/owners.handler";
import { createOwnervalidator, deleteOwnerByIdValidator, getOwnerByIdValidator, updateOwnerByIdValidator, updateTypeOwnerByIdValidator } from "../validators/owner.validator";
import { handleInpputErrors } from "../middleware";
const router = Router();

router.get('/', getOwners);

router.get('/:id',
    getOwnerByIdValidator,
    handleInpputErrors,
    getOwnerById);

router.post('/',
    //validaciones
    createOwnervalidator,
    handleInpputErrors,
    createOwner);

router.put('/:id',
    updateOwnerByIdValidator,
    handleInpputErrors,
    updateOwnerById);

router.patch('/:id',
    updateTypeOwnerByIdValidator,
    handleInpputErrors,
    updateTypeOwnerById);

router.delete('/:id',
    deleteOwnerByIdValidator,
    handleInpputErrors,
    deleteOwnerById);

export default router
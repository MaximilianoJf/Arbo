import { Response, Request } from "express";
import Owner from "../models/Owner.model";

export const createOwner = async (req: Request, res: Response) => {
    try {
        const owner = await Owner.create(req.body);
        return res.json({ data: owner });
    } catch (errors) {
        return res.status(500).json({ errors: errors });
    }
}

export const getOwners = async (req: Request, res: Response) => {
    try {
        const owners = await Owner.findAll({
            order: [
                ['id', 'DESC']
            ],
            limit: 10,
            attributes: {
                exclude: ['password', 'createdAt', 'updatedAt']
            }
        });

        return res.json({ data: owners });
    } catch (errors) {
        return res.status(500).json({ errors: errors })
    }
}

export const getOwnerById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const owner = await Owner.findByPk(id);

        if (!owner) {
            return res.status(404).json({ errors: `Owner with id ${id} not found` })
        }

        return res.json({ data: owner });

    } catch (errors) {
        return res.status(500).json({ errors: errors })
    }
}

export const updateOwnerById = async (req: Request, res: Response) => {
    try {

        console.log(req.body);

        const { id } = req.params;
        const owner = await Owner.findByPk(id);

        if (!owner) {
            return res.status(404).json({ errors: `Owner with id ${id} not found` })
        }

        await owner.update(req.body);

        return res.json({ data: owner });

    } catch (errors) {
        return res.status(500).json({ errors: errors })
    }
}

export const updateTypeOwnerById = async (req: Request, res: Response) => {
    try {
        // const { id } = req.params;
        // const owner = await Owner.findByPk(id);

        // if (!owner) {
        //     return res.status(404).json({ errors: `Owner with id ${id} not found` })
        // }

        // owner.role_id = req.body.role_id;

        // await owner.save()
        return res.json({ data: 'En construcción' });

    } catch (errors) {
        return res.status(500).json({ errors: errors })
    }
}

export const deleteOwnerById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const owner = await Owner.findByPk(id);

        if (!owner) {
            return res.status(404).json({ errors: `Owner with id ${id} not found` })
        }

        await owner.destroy()
        return res.json({ data: 'Owner deleted successfully' });

    } catch (errors) {
        return res.status(500).json({ errors: errors })
    }
}


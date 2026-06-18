import { Response, Request } from "express";
import User from "../models/User.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


export const createUser = async (req: Request, res: Response) => {
    try {

        const { name, email, password } = req.body;

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        const user = await User.create({ password: hash, email, name });

        const token = jwt.sign({ email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' });

        return res.json({ ok: true, token: token });


    } catch (errors) {
        return res.status(500).json({ errors: errors });
    }
}

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.findAll({
            order: [
                ['id', 'DESC']
            ],
            limit: 10,
            attributes: {
                exclude: ['password', 'createdAt', 'updatedAt']
            }
        });

        return res.json({ data: users });
    } catch (errors) {
        return res.status(500).json({ errors: errors })
    }
}

export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ errors: `User with id ${id} not found` })
        }

        return res.json({ data: user });

    } catch (errors) {
        return res.status(500).json({ errors: errors })
    }
}

export const updateUserById = async (req: Request, res: Response) => {
    try {

        console.log(req.body);

        const { id } = req.params;
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ errors: `User with id ${id} not found` })
        }

        await user.update(req.body);

        return res.json({ data: user });

    } catch (errors) {
        return res.status(500).json({ errors: errors })
    }
}

export const updateTypeUserById = async (req: Request, res: Response) => {
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

export const deleteUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ errors: `User with id ${id} not found` })
        }

        await user.destroy()
        return res.json({ data: 'User deleted successfully' });

    } catch (errors) {
        return res.status(500).json({ errors: errors })
    }
}


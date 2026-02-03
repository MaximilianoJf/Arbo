import { Request, Response } from 'express'

export const createProject = (req: Request, res: Response) => {

    res.json('Desde POST')
}
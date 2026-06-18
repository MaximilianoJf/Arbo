import jwt from 'jsonwebtoken'

export const verifyToken = (req, res, next) => {
    let token = req.headers.authorization

    if (!token) {
        return res.status(401).json({ msg: 'No token provided' })
    }

    token = token.split(" ")[1];

    try {
        const { email } = jwt.verify(token, process.env.JWT_SECRET)
        req.email = email
        next()
    } catch (error) {
        return res.status(401).json({ msg: 'Invalid token' })
    }



}
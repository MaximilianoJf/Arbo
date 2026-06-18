import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'arbo_key';

export const generateToken = (payload: object, expiresIn: string = '8h'): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};
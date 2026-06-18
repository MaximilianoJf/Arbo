import User from "../models/User.model";
import bcrypt from "bcryptjs";
import type { Login, User as IUser, Register } from "../types/user.types";
import { getUserByEmail, createUser, findOrCreateGoogleUser } from "../repositories/user.repository";
import { generateToken } from "../utils/jwt.util";


export const loginUser = async ({ email, password }: Login): Promise<{ user: IUser, token: string }> => {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error("User not found");
  }
  if (!user.password) {
    throw new Error("This account uses Google login. Please sign in with Google.");
  }
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    throw new Error("Invalid password");
  }
  const token = generateToken({ email: user.email, name: user.name });
  return { user: user.get({ plain: true }) as IUser, token };
};

export const registerUser = async ({ name, email, password }: Register): Promise<{ user: IUser, token: string }> => {
  const existUser = await getUserByEmail(email);
  if (existUser) {
    throw new Error("The email is already in use");
  }
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  const user = await createUser({ name, email, password: hash });
  const token = generateToken({ email: user.email, name: user.name });

  return { user: user.get({ plain: true }) as IUser, token };
};

export const googleAuth = async (profile: {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
}): Promise<{ user: IUser; token: string }> => {
  const user = await findOrCreateGoogleUser(profile);
  const token = generateToken({ email: user.email, name: user.name });
  return { user: user.get({ plain: true }) as IUser, token };
};

export const getProfile = async (email: string) => {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error("User not found");
  }
  return user.get({ plain: true }) as IUser;
}

import User from "../models/User.model";
import type { Register } from "../types/user.types";

export const getUserByEmail = async (email: string) => {
    const user = await User.findOne({ where: { email } })
    return user;
}

export const createUser = async (userData: Register) => {
    return await User.create(userData);
}

export const getUserByGoogleId = async (googleId: string) => {
    return await User.findOne({ where: { googleId } });
}

export const getUserById = async (id: number) => {
    return await User.findByPk(id);
}

export const findOrCreateGoogleUser = async (profile: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
}) => {
    // First try by googleId
    let user = await User.findOne({ where: { googleId: profile.googleId } });
    if (user) return user;

    // Then try by email (link existing account)
    user = await User.findOne({ where: { email: profile.email } });
    if (user) {
        user.googleId = profile.googleId;
        user.provider = "google";
        if (profile.avatar && !user.avatar) user.avatar = profile.avatar;
        await user.save();
        return user;
    }

    // Create new user
    return await User.create({
        name: profile.name,
        email: profile.email,
        googleId: profile.googleId,
        provider: "google",
        avatar: profile.avatar || null,
        password: null,
    });
}
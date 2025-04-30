import { IRegisterParam, ILoginParam } from "../interfaces/user.interface";
import prisma from "../lib/prisma";
import { hash, genSaltSync, compare } from "bcrypt";
import { sign } from "jsonwebtoken";
import { SECRET_KEY } from "../config";

/**
 * Get all users.
 */
async function GetAllService() {
  try {
    return await prisma.user.findMany();
  } catch (err) {
    throw err;
  }
}

/**
 * Find a user by email.
 * @param email - The email of the user.
 */
async function FindUserByEmail(email: string) {
  try {
    const user = await prisma.user.findFirst({
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        password: true,
        role: true,
      },
      where: { email },
    });

    return user;
  } catch (err) {
    throw err;
  }
}

/**
 * Register a new user.
 * @param param - The registration parameters.
 */
async function RegisterService(param: IRegisterParam) {
  try {
    const isExist = await FindUserByEmail(param.email);

    if (isExist) throw new Error("Email already registered");

    const salt = genSaltSync(10);
    const hashedPassword = await hash(param.password, salt);

    const user = await prisma.user.create({
      data: {
        first_name: param.first_name,
        last_name: param.last_name,
        email: param.email,
        isVerified: false,
        password: hashedPassword,
        role: "customer", // Default role
      },
    });

    return user;
  } catch (err) {
    throw err;
  }
}

/**
 * Log in a user.
 * @param param - The login parameters.
 */
async function LoginService(param: ILoginParam) {
  try {
    const user = await FindUserByEmail(param.email);

    if (!user) throw new Error("Email not registered");

    const checkPass = await compare(param.password, user.password);

    if (!checkPass) throw new Error("Incorrect password");

    const payload = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
    };

    const token = sign(payload, String(SECRET_KEY), { expiresIn: "1h" });

    return { user: payload, token };
  } catch (err) {
    throw err;
  }
}

export { RegisterService, LoginService, GetAllService };

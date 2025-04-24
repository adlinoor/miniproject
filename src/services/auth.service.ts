import { IRegisterParam, ILoginParam } from "../interfaces/user.interface";
import prisma from "../lib/prisma";
import { hash, genSaltSync, compare } from "bcrypt";
import { sign } from "jsonwebtoken";
import { cloudinaryUpload, cloudinaryRemove } from "../utils/cloudinary";
import { transporter } from "../utils/nodemailer";

import handlebars from "handlebars";
import path from "path";
import fs from "fs";

import { SECRET_KEY } from "../config";
import { z } from "zod";

export const RegisterSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["customer", "organizer"]),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

async function GetAll() {
  try {
    return await prisma.user.findMany();
  } catch (err) {
    throw err;
  }
}

async function FindUserByEmail(email: string) {
  try {
    const user = await prisma.user.findFirst({
      select: {
        first_name: true,
        last_name: true,
        email: true,
        password: true,
        role: true,
      },
      where: {
        email,
      },
    });

    return user;
  } catch (err) {
    throw err;
  }
}

async function RegisterService(param: IRegisterParam) {
  try {
    RegisterSchema.parse(param); // Validate input

    const isExist = await FindUserByEmail(param.email);

    if (isExist) throw new Error("Email already registered");

    await prisma.$transaction(async (t) => {
      const salt = genSaltSync(10);
      const hashedPassword = await hash(param.password, salt);

      const user = await t.user.create({
        data: {
          first_name: param.first_name, // Changed to match the Prisma schema
          last_name: param.last_name, // Changed to match the Prisma schema
          email: param.email,
          password: hashedPassword,
          role: param.role,
        },
      });

      const payload = { email: user.email };
      const token = sign(payload, String(SECRET_KEY), { expiresIn: "15m" });

      const templatePath = path.join(
        __dirname,
        "../templates",
        "register-template.hbs"
      );

      const templateSource = fs.readFileSync(templatePath, "utf-8");
      const compiledTemplate = handlebars.compile(templateSource);
      const html = compiledTemplate({
        email: param.email,
        fe_url: `${process.env.FRONTEND_URL}/activation?token=${token}`,
      });

      await transporter.sendMail({
        from: "EOHelper",
        to: param.email,
        subject: "Welcome",
        html,
      });

      return user;
    });
  } catch (err) {
    throw err;
  }
}

async function LoginService(param: ILoginParam) {
  try {
    const user = await FindUserByEmail(param.email);

    if (!user) throw new Error("Email not registered");

    const checkPass = await compare(param.password, user.password);

    if (!checkPass) throw new Error("Incorrect password");

    const payload = {
      email: user.email,
      first_name: user.first_name, // Changed to match the Prisma schema
      last_name: user.last_name, // Changed to match the Prisma schema
      role: user.role,
    };

    const token = sign(payload, String(SECRET_KEY), { expiresIn: "1h" });

    return { user: payload, token };
  } catch (err) {
    throw err;
  }
}

async function UpdateUserService(file: Express.Multer.File, email: string) {
  let url = "";
  try {
    const checkUser = await FindUserByEmail(email);

    if (!checkUser) throw new Error("User not found");

    await prisma.$transaction(async (t) => {
      let secure_url = "";
      try {
        const uploadResult = await cloudinaryUpload(file);
        secure_url = uploadResult.secure_url;
      } catch (err) {
        throw new Error("Failed to upload file to Cloudinary");
      }
      url = secure_url;
      const splitUrl = secure_url.split("/");
      const fileName = splitUrl[splitUrl.length - 1];

      await t.user.update({
        where: {
          email: checkUser.email,
        },
        data: {
          profilePicture: fileName, // Changed from "avatar" to "profilePicture"
        },
      });
    });
  } catch (err) {
    await cloudinaryRemove(url);
    throw err;
  }
}

export {
  RegisterService,
  LoginService,
  GetAll,
  UpdateUserService,
  FindUserByEmail,
};

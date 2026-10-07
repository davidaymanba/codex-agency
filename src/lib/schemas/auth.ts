import { z } from "zod";

/** Auth form schemas (messages are keys under `dash.auth.errors`). */
export const loginSchema = z.object({
  email: z.email("email"),
  password: z.string().min(6, "password"),
});

export const emailOnlySchema = z.object({ email: z.email("email") });

export const resetSchema = z
  .object({
    password: z.string().min(8, "passwordLength"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "mismatch", path: ["confirm"] });

export const inviteSchema = resetSchema.and(
  z.object({ fullName: z.string().trim().min(2, "required") }),
);

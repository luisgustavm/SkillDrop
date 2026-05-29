import { z } from "zod";

export const emailSchema = z.string().trim().email("Informe um e-mail válido.");

export const passwordSchema = z
  .string()
  .min(8, "A senha precisa ter pelo menos 8 caracteres.")
  .max(72, "A senha é longa demais.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe sua senha."),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(80, "Nome muito longo."),
  email: emailSchema,
  password: passwordSchema,
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

export const uploadMetadataSchema = z.object({
  title: z.string().trim().min(2, "Dê um título para o envio.").max(120, "Título muito longo."),
  description: z.string().trim().max(1000, "Descrição muito longa."),
  tags: z.string().trim().max(160, "Use menos tags."),
  visibility: z.enum(["private", "shared"]),
});

export const linkUploadSchema = uploadMetadataSchema.extend({
  url: z.string().trim().url("Informe um link válido."),
});

export const aiMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(8000),
});

export const aiChatRequestSchema = z.object({
  messages: z.array(aiMessageSchema).min(1).max(20),
  context: z.string().trim().max(6000).optional(),
  task: z.enum(["question", "explain_code", "summarize", "improve", "detect_errors", "describe_upload"]).default("question"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
export type UploadMetadataFormValues = z.infer<typeof uploadMetadataSchema>;
export type LinkUploadFormValues = z.infer<typeof linkUploadSchema>;

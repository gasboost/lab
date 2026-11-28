import { z } from "zod";

export const officeName = z
  .string()
  .trim()
  .min(1, "拠点名を入力してください。");

import { z } from "zod";

export const Layout = z.enum(["blog", "idea", "timeline"]);

export type Layout = z.infer<typeof Layout>;
import { z } from "zod";
import { Layout } from "./layout";

export const Space = z.object({
  // The id of the space
  id: z.string(),

  // The title of the space
  title: z.string(),

  // The image of the space
  image: z.string().optional(),

  // The description of the space
  description: z.string(),

  // The contributors to the space
  contributors: z.array(z.string()).default([]),

  // The tags of the space
  tags: z.array(z.string()).default([]),

  // The moments in the space
  moments: z.array(z.string()).default([]),

  // The date the space was created
  createdAt: z.string(),

  // The layout of the space
  layout: Layout.default("blog"),
});

export const CreateSpace = Space.omit({ id: true }).partial({
  createdAt: true,
});
export const UpdateSpace = Space.omit({ createdAt: true }).partial().required({
  id: true,
});
export const GetSpace = Space.pick({ id: true });
export const GetSpaces = Space.pick({
  title: true,
  tags: true,
  contributors: true,
}).partial();
export const DeleteSpace = Space.pick({ id: true });

// The type of the space
export type Space = z.infer<typeof Space>;

// create space request type
export type CreateSpace = z.input<typeof CreateSpace>;

// get space request type
export type GetSpace = z.input<typeof GetSpace>;
export type GetSpaces = z.input<typeof GetSpaces>;

// update space request type
export type UpdateSpace = z.input<typeof UpdateSpace>;

// delete space request type
export type DeleteSpace = z.input<typeof DeleteSpace>;

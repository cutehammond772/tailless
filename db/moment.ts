import { z } from "zod";

export const Moment = z.object({
  // The id of the moment
  id: z.string(),

  // The title of the moment
  title: z.string(),

  // The author of the moment
  author: z.string(),

  // The content of the moment
  content: z.string(),

  // The date the moment was created
  createdAt: z.string(),

  // The date the moment was last modified
  modifiedAt: z.string(),
});

export const CreateMoment = Moment.omit({ id: true }).partial({
  author: true,
  createdAt: true,
  modifiedAt: true,
});
export const UpdateMoment = Moment.omit({ createdAt: true }).partial().required({
  id: true,
});
export const GetMoment = Moment.pick({ id: true });
export const GetMoments = Moment.pick({
  title: true,
  author: true,
}).partial();
export const DeleteMoment = Moment.pick({ id: true });

// The type of the moment
export type Moment = z.infer<typeof Moment>;

// create moment request type
export type CreateMoment = z.input<typeof CreateMoment>;

// get moment request type
export type GetMoment = z.input<typeof GetMoment>;
export type GetMoments = z.input<typeof GetMoments>;

// update moment request type
export type UpdateMoment = z.input<typeof UpdateMoment>;

// delete moment request type
export type DeleteMoment = z.input<typeof DeleteMoment>;

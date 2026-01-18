// import { createId } from "@paralleldrive/cuid2";
// import slugify from "@sindresorhus/slugify";
// import { createZodDto } from "nestjs-zod/dto";
// import { z } from "zod";

// export const createResumeSchema = z.object({
//   title: z.string().min(1),
//   slug: z
//     .string()
//     .min(1)
//     .transform((value) => {
//       const slug = slugify(value);
//       if (!slug) return createId();
//       return slug;
//     })
//     .optional(),
//   visibility: z.enum(["public", "private"]).default("private"),
// });

// export class CreateResumeDto extends createZodDto(createResumeSchema) {}


// create-resume.dto.ts
import { createId } from "@paralleldrive/cuid2";
import slugify from "@sindresorhus/slugify";
import { createZodDto } from "nestjs-zod/dto";
import { z } from "zod";
import { resumeDataSchema } from "@reactive-resume/schema";

export const createResumeSchema = z.object({
  title: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .transform((value) => {
      const slug = slugify(value);
      if (!slug) return createId();
      return slug;
    })
    .optional(),
  visibility: z.enum(["public", "private"]).default("private"),
  // Add optional data field for AI-generated resumes
  data: resumeDataSchema.optional(),
});

export class CreateResumeDto extends createZodDto(createResumeSchema) {}
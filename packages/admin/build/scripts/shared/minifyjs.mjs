import { rollup } from "rollup";
import terser from "@rollup/plugin-terser";

const INLINE_ENTRY_ID = "\0atria-inline-entry";

export const minifyJs = async (source) => {
  const bundle = await rollup({
    input: INLINE_ENTRY_ID,
    plugins: [
      {
        name: "atria-inline-source",
        resolveId(id) {
          if (id === INLINE_ENTRY_ID) {
            return id;
          }

          return null;
        },
        load(id) {
          if (id === INLINE_ENTRY_ID) {
            return source;
          }

          return null;
        },
      },
      terser({
        format: {
          comments: false,
        },
      }),
    ],
  });

  try {
    const generated = await bundle.generate({ format: "es" });
    const chunk = generated.output.find((output) => output.type === "chunk");

    if (!chunk) {
      throw new Error("Failed to generate minified javascript chunk");
    }

    return `${chunk.code}\n`;
  } finally {
    await bundle.close();
  }
};

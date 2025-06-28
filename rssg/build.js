import esbuild from "esbuild";
import { sassPlugin } from "esbuild-sass-plugin";
import path from "path";
import { promises as fsPromises } from "fs";
import prettyBytes from "pretty-bytes";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fp = "./rssg/build.ts";
const cacheFile = "./rssg/.rssg-cache/cli.js";
const configFile = path.resolve(__dirname, "./tsconfig.json");

async function buildRssgStatic() {
  console.log(`\nStarting Rssg static build...\n`);

  try {
    const result = await esbuild.build({
      entryPoints: [fp],
      outfile: cacheFile,
      bundle: true,
      keepNames: true,
      minifyWhitespace: true,
      minifySyntax: true,
      platform: "node",
      format: "esm",
      jsx: "automatic",
      jsxImportSource: "preact",
      packages: "external",
      metafile: true,
      sourcemap: true,
      sourcesContent: false,
      tsconfig: configFile,
      plugins: [
        sassPlugin({
          type: "css-text",
          cssImports: true,
        }),
        sassPlugin({
          filter: /\.inline\.scss$/,
          type: "css",
          cssImports: true,
        }),
        {
          name: "inline-script-loader",
          setup(build) {
            build.onLoad({ filter: /\.inline?\.(ts|js)$/ }, async (args) => {
              let text = await fsPromises.readFile(args.path, "utf8");

              // Remove default exports that were manually inserted
              text = text.replace("export default", "").replace("export", "");

              const sourcefile = path.relative(path.resolve("."), args.path);
              const resolveDir = path.dirname(sourcefile);
              const transpiled = await esbuild.build({
                stdin: {
                  contents: text,
                  loader: "ts",
                  resolveDir,
                  sourcefile,
                },
                write: false,
                bundle: true,
                minify: true,
                platform: "browser",
                format: "esm",
              });
              const rawMod = transpiled.outputFiles[0].text;
              return {
                contents: rawMod,
                loader: "text",
              };
            });
          },
        },
      ],
    });

    console.log(`Setup completed.`);

    console.log(await esbuild.analyzeMetafile(result.metafile, { color: true }));

    console.log(`Build completed successfully.`);
  } catch (error) {
    console.error(`Error during build: ${error.message}`);
    process.exit(1);
  }
}

buildRssgStatic();

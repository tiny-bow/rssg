import sourceMapSupport from "source-map-support"
sourceMapSupport.install(options)
import path from "path"
import { PerfTimer } from "./util/perf"
import { readFile, rm } from "fs/promises"
import { GlobbyFilterFunction, isGitIgnored } from "globby"
import { styleText } from "util"
import { parseMarkdown } from "./processors/parse"
import { filterContent } from "./processors/filter"
import { emitContent } from "./processors/emit"
import { FilePath, joinSegments, slugifyFilePath } from "./util/path"
import chokidar from "chokidar"
import { ProcessedContent } from "./plugins/vfile"
import { Argv, BuildCtx } from "./util/ctx"
import { glob, toPosixPath } from "./util/glob"
import { trace } from "./util/trace"
import { options } from "./util/sourcemap"
import { Mutex } from "async-mutex"
import { getStaticResourcesFromPlugins } from "./plugins"
import { randomIdNonSecure } from "./util/random"
import { ChangeEvent } from "./plugins/types"
import { minimatch } from "minimatch"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import { DocumentConfiguration, HostConfiguration, RssgConfig } from "./cfg"

import PluginSet from "./plugin"
import DefaultScheme from "./scheme"
import { ColorScheme, TypographySpecification } from "util/theme"


type ContentMap = Map<
  FilePath,
  | {
      type: "markdown"
      content: ProcessedContent
    }
  | {
      type: "other"
    }
>

type BuildData = {
  ctx: BuildCtx
  ignored: GlobbyFilterFunction
  mut: Mutex
  contentMap: ContentMap
  changesSinceLastBuild: Record<FilePath, ChangeEvent["type"]>
  lastBuildMs: number
}

async function buildRssg(cfg: RssgConfig, argv: Argv, mut: Mutex, clientRefresh: () => void) {
  const ctx: BuildCtx = {
    buildId: randomIdNonSecure(),
    argv,
    cfg,
    allSlugs: [],
    allFiles: [],
    incremental: false,
  }

  const perf = new PerfTimer()
  const output = argv.output

  const pluginCount = Object.values(cfg.plugins).flat().length
  const pluginNames = (key: "transformers" | "filters" | "emitters") =>
    cfg.plugins[key].map((plugin) => plugin.name)
  if (argv.verbose) {
    console.log(`Loaded ${pluginCount} plugins`)
    console.log(`  Transformers: ${pluginNames("transformers").join(", ")}`)
    console.log(`  Filters: ${pluginNames("filters").join(", ")}`)
    console.log(`  Emitters: ${pluginNames("emitters").join(", ")}`)
  }

  const release = await mut.acquire()
  perf.addEvent("clean")
  await rm(output, { recursive: true, force: true })
  console.log(`Cleaned output directory \`${output}\` in ${perf.timeSince("clean")}`)

  perf.addEvent("glob")
  console.log(`applying glob **/*.* to \`${argv.directory}\`...`)
  const allFiles = await glob("**/*.*", argv.directory, cfg.configuration.ignorePatterns)
  const markdownPaths = allFiles.filter((fp) => fp.endsWith(".md")).sort()
  console.log(
    `Found ${markdownPaths.length} input files from \`${argv.directory}\` in ${perf.timeSince("glob")}:\n${markdownPaths.join(", ")}`,
  )

  const filePaths = markdownPaths.map((fp) => joinSegments(argv.directory, fp) as FilePath)
  ctx.allFiles = allFiles
  ctx.allSlugs = allFiles.map((fp) => slugifyFilePath(fp as FilePath))

  const parsedFiles = await parseMarkdown(ctx, filePaths)
  const filteredContent = filterContent(ctx, parsedFiles)

  console.log("Emitting content...")
  
  await emitContent(ctx, filteredContent)
  console.log(
    styleText("green", `Done processing ${markdownPaths.length} files in ${perf.timeSince()}`),
  )
  release()

  if (argv.watch) {
    ctx.incremental = true
    return startWatching(ctx, mut, parsedFiles, clientRefresh)
  }
}

// setup watcher for rebuilds
async function startWatching(
  ctx: BuildCtx,
  mut: Mutex,
  initialContent: ProcessedContent[],
  clientRefresh: () => void,
) {
  const { argv, allFiles } = ctx

  const contentMap: ContentMap = new Map()
  for (const filePath of allFiles) {
    contentMap.set(filePath, {
      type: "other",
    })
  }

  for (const content of initialContent) {
    const [_tree, vfile] = content
    contentMap.set(vfile.data.relativePath!, {
      type: "markdown",
      content,
    })
  }

  const gitIgnoredMatcher = await isGitIgnored()
  const buildData: BuildData = {
    ctx,
    mut,
    contentMap,
    ignored: (fp) => {
      const pathStr = toPosixPath(fp.toString())
      if (pathStr.startsWith(".git/")) return true
      if (gitIgnoredMatcher(pathStr)) return true
      for (const pattern of ctx.cfg.configuration.ignorePatterns) {
        if (minimatch(pathStr, pattern)) {
          return true
        }
      }

      return false
    },

    changesSinceLastBuild: {},
    lastBuildMs: 0,
  }

  const watcher = chokidar.watch(".", {
    persistent: true,
    cwd: argv.directory,
    ignoreInitial: true,
  })

  const changes: ChangeEvent[] = []
  watcher
    .on("add", (fp) => {
      if (buildData.ignored(fp)) return
      changes.push({ path: fp as FilePath, type: "add" })
      void rebuild(changes, clientRefresh, buildData)
    })
    .on("change", (fp) => {
      if (buildData.ignored(fp)) return
      changes.push({ path: fp as FilePath, type: "change" })
      void rebuild(changes, clientRefresh, buildData)
    })
    .on("unlink", (fp) => {
      if (buildData.ignored(fp)) return
      changes.push({ path: fp as FilePath, type: "delete" })
      void rebuild(changes, clientRefresh, buildData)
    })

  return async () => {
    await watcher.close()
  }
}

async function rebuild(changes: ChangeEvent[], clientRefresh: () => void, buildData: BuildData) {
  const { ctx, contentMap, mut, changesSinceLastBuild } = buildData
  const { argv, cfg } = ctx

  const buildId = randomIdNonSecure()
  ctx.buildId = buildId
  buildData.lastBuildMs = new Date().getTime()
  const numChangesInBuild = changes.length
  const release = await mut.acquire()

  // if there's another build after us, release and let them do it
  if (ctx.buildId !== buildId) {
    release()
    return
  }

  const perf = new PerfTimer()
  perf.addEvent("rebuild")
  console.log(styleText("yellow", "Detected change, rebuilding..."))

  // update changesSinceLastBuild
  for (const change of changes) {
    changesSinceLastBuild[change.path] = change.type
  }

  const staticResources = getStaticResourcesFromPlugins(ctx)
  const pathsToParse: FilePath[] = []
  for (const [fp, type] of Object.entries(changesSinceLastBuild)) {
    if (type === "delete" || path.extname(fp) !== ".md") continue
    const fullPath = joinSegments(argv.directory, toPosixPath(fp)) as FilePath
    pathsToParse.push(fullPath)
  }

  const parsed = await parseMarkdown(ctx, pathsToParse)
  for (const content of parsed) {
    contentMap.set(content[1].data.relativePath!, {
      type: "markdown",
      content,
    })
  }

  // update state using changesSinceLastBuild
  // we do this weird play of add => compute change events => remove
  // so that partialEmitters can do appropriate cleanup based on the content of deleted files
  for (const [file, change] of Object.entries(changesSinceLastBuild)) {
    if (change === "delete") {
      // universal delete case
      contentMap.delete(file as FilePath)
    }

    // manually track non-markdown files as processed files only
    // contains markdown files
    if (change === "add" && path.extname(file) !== ".md") {
      contentMap.set(file as FilePath, {
        type: "other",
      })
    }
  }

  const changeEvents: ChangeEvent[] = Object.entries(changesSinceLastBuild).map(([fp, type]) => {
    const path = fp as FilePath
    const processedContent = contentMap.get(path)
    if (processedContent?.type === "markdown") {
      const [_tree, file] = processedContent.content
      return {
        type,
        path,
        file,
      }
    }

    return {
      type,
      path,
    }
  })

  // update allFiles and then allSlugs with the consistent view of content map
  ctx.allFiles = Array.from(contentMap.keys())
  ctx.allSlugs = ctx.allFiles.map((fp) => slugifyFilePath(fp as FilePath))
  const processedFiles = Array.from(contentMap.values())
    .filter((file) => file.type === "markdown")
    .map((file) => file.content)

  let emittedFiles = 0
  for (const emitter of cfg.plugins.emitters) {
    // Try to use partialEmit if available, otherwise assume the output is static
    const emitFn = emitter.partialEmit ?? emitter.emit
    const emitted = await emitFn(ctx, processedFiles, staticResources, changeEvents)
    if (emitted === null) {
      continue
    }

    if (Symbol.asyncIterator in emitted) {
      // Async generator case
      for await (const file of emitted) {
        emittedFiles++
        if (ctx.argv.verbose) {
          console.log(`[emit:${emitter.name}] ${file}`)
        }
      }
    } else {
      // Array case
      emittedFiles += emitted.length
      if (ctx.argv.verbose) {
        for (const file of emitted) {
          console.log(`[emit:${emitter.name}] ${file}`)
        }
      }
    }
  }

  console.log(`Emitted ${emittedFiles} files to \`${argv.output}\` in ${perf.timeSince("rebuild")}`)
  console.log(styleText("green", `Done rebuilding in ${perf.timeSince()}`))
  changes.splice(0, numChangesInBuild)
  clientRefresh()
  release()
}


export const BuildArgv = {
  directory: {
    string: true,
    alias: ["d"],
    describe: "directory to look for content files",
  },
  verbose: {
    boolean: true,
    alias: ["v"],
    default: false,
    describe: "print out extra logging information",
  },
  output: {
    string: true,
    alias: ["o"],
    describe: "output folder for files",
  },
  serve: {
    boolean: true,
    default: false,
    describe: "run a local server to live-preview your Rssg",
  },
  watch: {
    boolean: true,
    default: false,
    describe: "watch for changes and rebuild automatically",
  },
  baseDir: {
    string: true,
    default: "",
    describe: "base path to serve your local server on",
  },
  port: {
    number: true,
    default: 8080,
    describe: "port to serve Rssg on",
  },
  wsPort: {
    number: true,
    default: 3001,
    describe: "port to use for WebSocket-based hot-reload notifications",
  },
  remoteDevHost: {
    string: true,
    default: "",
    describe: "A URL override for the websocket connection if you are not developing on localhost",
  },
  bundleInfo: {
    boolean: true,
    default: false,
    describe: "show detailed bundle information",
  },
  concurrency: {
    number: true,
    default: 1,
    describe: "how many threads to use to parse notes",
  },
}

async function cliWrapper() {
  let mincfg: any = {}
  try {
    const configPath = path.join(process.cwd(), ".rssg", "config.json")
    console.log(`Using configuration from ${configPath}`)
    const configContent = await readFile(configPath, "utf-8")
    mincfg = JSON.parse(configContent)
  } catch (err) {
    console.error("Failed to read .rssg/config.json:", err)
    process.exit(1)
  }

  const is = (obj: any, name: string): boolean => 
    typeof obj === name && obj !== null

  if(!is(mincfg, "object")) {
    throw new Error("Invalid .rssg/config.json: expected an object")
  }

  let host: HostConfiguration | undefined
  
  if (is(mincfg.host, "object")) {
    if (!is(mincfg.host.title, "string") || !is(mincfg.host.url, "string")) {
      throw new Error("Invalid host configuration in .rssg/config.json: expected { title: string, url: string, image?: string }")
    }

    host = {
      title: mincfg.host.title,
      url: mincfg.host.url,
      image: is(mincfg.host.image, "string") ? mincfg.host.image : undefined,
    }
  }

  let scheme: ColorScheme = DefaultScheme

  if (is(mincfg.scheme, "object")) {
    if (!is(mincfg.scheme.foreground, "string") || !is(mincfg.scheme.background, "string") ||
        !is(mincfg.scheme.overlay, "string") || !is(mincfg.scheme.dark_overlay, "string")) {
      throw new Error("Invalid scheme configuration in .rssg/config.json: expected { foreground: string, background: string, overlay: string, dark_overlay: string }")
    }

    scheme = {
      light: mincfg.scheme.background,
      lightgray: mincfg.scheme.overlay,
      gray: mincfg.scheme.foreground,
      darkgray: mincfg.scheme.foreground,
      dark: mincfg.scheme.foreground,
      secondary: mincfg.scheme.foreground,
      tertiary: mincfg.scheme.foreground,
      highlight: mincfg.scheme.overlay,
      textHighlight: mincfg.scheme.dark_overlay,
    }
  }

  let typography: TypographySpecification = {
    title: "Roboto",
    header: "Roboto",
    body: "Roboto",
    code: "Roboto Mono",
  }

  if (is(mincfg.typography, "object")) {
    if (!is(mincfg.typography.title, "string") || !is(mincfg.typography.header, "string") ||
        !is(mincfg.typography.body, "string") || !is(mincfg.typography.code, "string")) {
      throw new Error("Invalid typography configuration in .rssg/config.json: expected { title: string, header: string, body: string, code: string }")
    }

    typography = {
      title: mincfg.typography.title,
      header: mincfg.typography.header,
      body: mincfg.typography.body,
      code: mincfg.typography.code,
    }
  }

  let document: DocumentConfiguration = {
      title: "",
      titleSuffix: "",
  }

  if (is(mincfg.document, "object")) {
    if (!is(mincfg.document.title, "string") || !is(mincfg.document.titleSuffix, "string")) {
      throw new Error("Invalid document configuration in .rssg/config.json: expected { title: string, titleSuffix: string, image?: string }")
    }

    document = {
      title: mincfg.document.title,
      titleSuffix: mincfg.document.titleSuffix,
      image: is(mincfg.document.image, "string") ? mincfg.document.image : undefined,
    }
  } else {
    throw new Error("Invalid document configuration in .rssg/config.json: expected { title: string, titleSuffix: string, image?: string }")
  }

  let pageTitle: string
  if (is(mincfg.pageTitle, "string")) {
    pageTitle = mincfg.pageTitle
  } else {
    throw new Error("Invalid pageTitle in .rssg/config.json: expected a string")
  }

  let pageTitleSuffix: string
  if (is(mincfg.pageTitleSuffix, "string")) {
    pageTitleSuffix = mincfg.pageTitleSuffix
  } else {
    throw new Error("Invalid pageTitleSuffix in .rssg/config.json: expected a string")
  }

  let baseUrl: string
  if (is(mincfg.baseUrl, "string")) {
    baseUrl = mincfg.baseUrl
  } else {
    throw new Error("Invalid baseUrl in .rssg/config.json: expected a string")
  }

  const cfg: RssgConfig = {
    configuration: {
      host,
      document,
      pageTitle,
      pageTitleSuffix,
      baseUrl,

      enableSPA: true,
      enablePopovers: true,
      analytics: {
        provider: "plausible",
      },
      locale: "en-US",
      ignorePatterns: ["private", "templates", ".obsidian"],
      defaultDateType: "modified",
      theme: {
        fontOrigin: "googleFonts",
        cdnCaching: true,
        typography,
        colors: {
          lightMode: scheme,
          darkMode: scheme,
        },
      },
    },
    plugins: PluginSet
  };

  const rawArgv = await yargs(hideBin(process.argv))
    .scriptName("rssg-build")
    .usage("$0 [args]")
    .options(BuildArgv)
    .help()
    .strict()
    .argv

  const mut = new Mutex()
  const clientRefresh = () => {}

  if (rawArgv.directory === undefined || rawArgv.directory === "") {
    trace("\nExiting Rssg due to a fatal error", new Error("Missing content directory"))
    process.exit(1)
  }

  if (rawArgv.output === undefined || rawArgv.output === "") {
    trace("\nExiting Rssg due to a fatal error", new Error("Missing output directory"))
    process.exit(1)
  }

  const argv: Argv = {
    ...rawArgv,
    concurrency: rawArgv.concurrency as number | undefined,
    directory: rawArgv.directory as string,
    output: rawArgv.output as string,
  }

  try {
    console.log(`Starting Rssg build with options:`, argv)

    await buildRssg(cfg, argv, mut, clientRefresh)

    console.log(`Rssg build completed successfully.`)
  } catch (err) {
    trace("\nExiting Rssg due to a fatal error", err as Error)
    process.exit(1)
  }
}

await cliWrapper()

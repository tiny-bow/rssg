import { PluggableList } from "unified"
import { StaticResources } from "../util/resources"
import { ProcessedContent } from "./vfile"
import { RssgComponent } from "../components/types"
import { FilePath } from "../util/path"
import { BuildCtx } from "../util/ctx"
import { VFile } from "vfile"

export interface PluginTypes {
  transformers: RssgTransformerPluginInstance[]
  filters: RssgFilterPluginInstance[]
  emitters: RssgEmitterPluginInstance[]
}

type OptionType = object | undefined
type ExternalResourcesFn = (ctx: BuildCtx) => Partial<StaticResources> | undefined
export type RssgTransformerPlugin<Options extends OptionType = undefined> = (
  opts?: Options,
) => RssgTransformerPluginInstance
export type RssgTransformerPluginInstance = {
  name: string
  textTransform?: (ctx: BuildCtx, src: string) => string
  markdownPlugins?: (ctx: BuildCtx) => PluggableList
  htmlPlugins?: (ctx: BuildCtx) => PluggableList
  externalResources?: ExternalResourcesFn
}

export type RssgFilterPlugin<Options extends OptionType = undefined> = (
  opts?: Options,
) => RssgFilterPluginInstance
export type RssgFilterPluginInstance = {
  name: string
  shouldPublish(ctx: BuildCtx, content: ProcessedContent): boolean
}

export type ChangeEvent = {
  type: "add" | "change" | "delete"
  path: FilePath
  file?: VFile
}

export type RssgEmitterPlugin<Options extends OptionType = undefined> = (
  opts?: Options,
) => RssgEmitterPluginInstance
export type RssgEmitterPluginInstance = {
  name: string
  emit: (
    ctx: BuildCtx,
    content: ProcessedContent[],
    resources: StaticResources,
  ) => Promise<FilePath[]> | AsyncGenerator<FilePath>
  partialEmit?: (
    ctx: BuildCtx,
    content: ProcessedContent[],
    resources: StaticResources,
    changeEvents: ChangeEvent[],
  ) => Promise<FilePath[]> | AsyncGenerator<FilePath> | null
  /**
   * Returns the components (if any) that are used in rendering the page.
   * This helps Rssg optimize the page by only including necessary resources
   * for components that are actually used.
   */
  getRssgComponents?: (ctx: BuildCtx) => RssgComponent[]
  externalResources?: ExternalResourcesFn
}

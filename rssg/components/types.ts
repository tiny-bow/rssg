import { ComponentType, JSX } from "preact"
import { StaticResources, StringResource } from "../util/resources"
import { RssgPluginData } from "../plugins/vfile"
import { GlobalConfiguration } from "../cfg"
import { Node } from "hast"
import { BuildCtx } from "../util/ctx"

export type RssgComponentProps = {
  ctx: BuildCtx
  externalResources: StaticResources
  fileData: RssgPluginData
  cfg: GlobalConfiguration
  children: (RssgComponent | JSX.Element)[]
  tree: Node
  allFiles: RssgPluginData[]
  displayClass?: "mobile-only" | "desktop-only"
} & JSX.IntrinsicAttributes & {
    [key: string]: any
  }

export type RssgComponent = ComponentType<RssgComponentProps> & {
  css?: StringResource
  beforeDOMLoaded?: StringResource
  afterDOMLoaded?: StringResource
}

export type RssgComponentConstructor<Options extends object | undefined = undefined> = (
  opts: Options,
) => RssgComponent

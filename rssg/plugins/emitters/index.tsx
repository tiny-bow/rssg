export { ContentPage } from "./contentPage"
export { TagPage } from "./tagPage"
export { FolderPage } from "./folderPage"
export { ContentIndex as ContentIndex } from "./contentIndex"
export { AliasRedirects } from "./aliases"
export { Assets } from "./assets"
export { Static } from "./static"
export { Favicon } from "./favicon"
export { ComponentResources } from "./componentResources"
export { NotFoundPage } from "./404"
export { CNAME } from "./cname"
export { CustomOgImages } from "./ogImage"


// import { RssgEmitterPlugin } from "../types"
// import { RssgComponentProps, RssgComponent, RssgComponentConstructor } from "../../components/types"
// import BodyConstructor from "../../components/Body"
// import { pageResources, renderPage } from "../../components/renderPage"
// import { FullPageLayout } from "../../cfg"
// import { FullSlug, pathToRoot, sluggify } from "../../util/path"
// import { sharedPageComponents } from "../../../rssg.layout"
// import { defaultProcessedContent } from "../vfile"
// import { write } from "./helpers"


// const IndexComponent: RssgComponent = ({ cfg }: RssgComponentProps) => {
//   return (
//     <article class="popover-hint">
//       <h1><a href={cfg.hostUrl}>{cfg.hostTitle}</a></h1>
//       <h2><a href={`/${sluggify(cfg.docFile)}`}>{cfg.pageTitle}</a></h2>
//     </article>
//   )
// }

// const Index = (() => IndexComponent) satisfies RssgComponentConstructor

// export const IndexPage: RssgEmitterPlugin = () => {
//   const opts: FullPageLayout = {
//     ...sharedPageComponents,
//     pageBody: Index(),
//     beforeBody: [],
//     left: [],
//     right: [],
//   }

//   const { head: Head, pageBody, footer: Footer } = opts
//   const Body = BodyConstructor()

//   return {
//     name: "IndexPage",
//     getRssgComponents() {
//       return [Head, Body, pageBody, Footer]
//     },
//     async *emit(ctx, _content, resources) {
//       const cfg = ctx.cfg.configuration
//       const slug = "index" as FullSlug

//       const name = cfg.pageTitle
//       const [tree, vfile] = defaultProcessedContent({
//         slug,
//         text: name,
//         description: name,
//         frontmatter: { title: name, tags: [] },
//       })
//       const externalResources = pageResources(pathToRoot(slug), resources)
//       const componentData: RssgComponentProps = {
//         ctx,
//         fileData: vfile.data,
//         externalResources,
//         cfg,
//         children: [],
//         tree,
//         allFiles: [],
//       }

//       yield write({
//         ctx,
//         content: renderPage(cfg, slug, componentData, opts, externalResources),
//         slug,
//         ext: ".html",
//       })
//     },
//     async *partialEmit() {},
//   }
// }
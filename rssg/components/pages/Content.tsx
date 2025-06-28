import { ComponentChildren } from "preact"
import { htmlToJsx } from "../../util/jsx"
import { RssgComponent, RssgComponentConstructor, RssgComponentProps } from "../types"

const Content: RssgComponent = ({ fileData, tree }: RssgComponentProps) => {
  const content = htmlToJsx(fileData.filePath!, tree) as ComponentChildren
  const classes: string[] = fileData.frontmatter?.cssclasses ?? []
  const classString = ["popover-hint", ...classes].join(" ")
  return <article class={classString}>{content}</article>
}

export default (() => Content) satisfies RssgComponentConstructor

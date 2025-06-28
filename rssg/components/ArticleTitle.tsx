import { RssgComponent, RssgComponentConstructor, RssgComponentProps } from "./types"
import { classNames } from "../util/lang"

const ArticleTitle: RssgComponent = ({ fileData, displayClass }: RssgComponentProps) => {
  const title = fileData.frontmatter?.title
  if (title && title != "index") {
    return <h1 class={classNames(displayClass, "article-title")}>{title}</h1>
  } else {
    let slug: string = fileData.slug!;
    if (slug.endsWith("/index")) slug = slug.slice(0, -6);
    slug = slug.split("/").pop() || slug;
    return <h1 class={classNames(displayClass, "article-title")}>{slug}</h1>
  }
}

ArticleTitle.css = `
.article-title {
  margin: 2rem 0 0 0;
}
`

export default (() => ArticleTitle) satisfies RssgComponentConstructor

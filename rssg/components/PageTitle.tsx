import { RssgComponent, RssgComponentConstructor, RssgComponentProps } from "./types"
import { classNames } from "../util/lang"

const PageTitle: RssgComponent = ({ cfg, displayClass }: RssgComponentProps) => {
  return (<div class={classNames(displayClass, "page-title")}>
    {cfg.host && <h3><a href={cfg.host.url}>{cfg.host.title}{cfg.host.title.endsWith("s") ? "'" : "'s"}</a></h3>}
    <h1><a href="/">{cfg.document.title}:</a></h1>
    <h2><a href="/">{cfg.document.titleSuffix}</a></h2>
  </div>)
}

PageTitle.css = `
.page-title {
  font-family: var(--titleFont);
  text-align: right;

  & h1, h2, h3 {
    margin: 0;
  }

  & h3 {
    text-align: left;
  }
}
`

export default (() => PageTitle) satisfies RssgComponentConstructor

import { RssgComponent, RssgComponentConstructor, RssgComponentProps } from "./types"
import { classNames } from "../util/lang"

const PageTitle: RssgComponent = ({ cfg, displayClass }: RssgComponentProps) => {
  return (<div class={classNames(displayClass, "page-title")}>
    <h3><a href={cfg.hostUrl}>{cfg.hostTitle}{cfg.hostTitle.endsWith("s") ? "'" : "'s"}</a></h3>
    <h1><a href="/">{cfg.docTitle}:</a></h1>
    <h2><a href="/">{cfg.docTitleSuffix}</a></h2>
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

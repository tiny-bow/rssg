// @ts-ignore
import clipboardScript from "./scripts/clipboard.inline"
import clipboardStyle from "./styles/clipboard.scss"
import { RssgComponent, RssgComponentConstructor, RssgComponentProps } from "./types"

const Body: RssgComponent = ({ children }: RssgComponentProps) => {
  return <div id="rssg-body">{children}</div>
}

Body.afterDOMLoaded = clipboardScript
Body.css = clipboardStyle

export default (() => Body) satisfies RssgComponentConstructor

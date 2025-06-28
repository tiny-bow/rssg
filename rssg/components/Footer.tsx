import { RssgComponent, RssgComponentConstructor, RssgComponentProps } from "./types"
import style from "./styles/footer.scss"

interface Options {
}

export default ((_?: Options) => {
  const Footer: RssgComponent = ({ displayClass, ctx }: RssgComponentProps) => {
    const cfg = ctx.cfg.configuration
    const year = new Date().getFullYear()
    return (
      <footer class={`${displayClass ?? ""}`}>
        <a href="/Copyright">Copyright © {year} {cfg.hostTitle}. All rights reserved.</a>
      </footer>
    )
  }

  Footer.css = style
  return Footer
}) satisfies RssgComponentConstructor

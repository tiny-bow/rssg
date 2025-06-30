import { RssgComponent, RssgComponentConstructor, RssgComponentProps } from "./types"
import style from "./styles/footer.scss"

interface Options {
}

export default ((_?: Options) => {
  const Footer: RssgComponent = ({ displayClass, ctx }: RssgComponentProps) => {
    const cfg = ctx.cfg.configuration

    const notice = cfg.copyright.replace(/%(\w+)/g, (_: any, arg: string) => {
        switch (arg) {
            case "c": return "©"
            case "year": return new Date().getFullYear()
            case "host": return cfg.host?.title
            default: throw `Unexpected copyright parameter "${arg}"`
        }
    })


    return (
      <footer class={`${displayClass ?? ""}`}>
        <a href="/Copyright">{notice}</a>
      </footer>
    )
  }

  Footer.css = style
  return Footer
}) satisfies RssgComponentConstructor

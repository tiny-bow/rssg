import { RssgComponent, RssgComponentConstructor, RssgComponentProps } from "./types"

type ConditionalRenderConfig = {
  component: RssgComponent
  condition: (props: RssgComponentProps) => boolean
}

export default ((config: ConditionalRenderConfig) => {
  const ConditionalRender: RssgComponent = (props: RssgComponentProps) => {
    if (config.condition(props)) {
      return <config.component {...props} />
    }

    return null
  }

  ConditionalRender.afterDOMLoaded = config.component.afterDOMLoaded
  ConditionalRender.beforeDOMLoaded = config.component.beforeDOMLoaded
  ConditionalRender.css = config.component.css

  return ConditionalRender
}) satisfies RssgComponentConstructor<ConditionalRenderConfig>

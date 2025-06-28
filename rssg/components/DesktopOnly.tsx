import { RssgComponent, RssgComponentConstructor, RssgComponentProps } from "./types"

export default ((component: RssgComponent) => {
  const Component = component
  const DesktopOnly: RssgComponent = (props: RssgComponentProps) => {
    return <Component displayClass="desktop-only" {...props} />
  }

  DesktopOnly.displayName = component.displayName
  DesktopOnly.afterDOMLoaded = component?.afterDOMLoaded
  DesktopOnly.beforeDOMLoaded = component?.beforeDOMLoaded
  DesktopOnly.css = component?.css
  return DesktopOnly
}) satisfies RssgComponentConstructor<RssgComponent>

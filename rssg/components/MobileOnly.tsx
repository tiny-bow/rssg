import { RssgComponent, RssgComponentConstructor, RssgComponentProps } from "./types"

export default ((component: RssgComponent) => {
  const Component = component
  const MobileOnly: RssgComponent = (props: RssgComponentProps) => {
    return <Component displayClass="mobile-only" {...props} />
  }

  MobileOnly.displayName = component.displayName
  MobileOnly.afterDOMLoaded = component?.afterDOMLoaded
  MobileOnly.beforeDOMLoaded = component?.beforeDOMLoaded
  MobileOnly.css = component?.css
  return MobileOnly
}) satisfies RssgComponentConstructor<RssgComponent>

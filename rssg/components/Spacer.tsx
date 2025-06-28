import { RssgComponentConstructor, RssgComponentProps } from "./types"
import { classNames } from "../util/lang"

function Spacer({ displayClass }: RssgComponentProps) {
  return <div class={classNames(displayClass, "spacer")}></div>
}

export default (() => Spacer) satisfies RssgComponentConstructor

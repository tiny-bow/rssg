import { RssgTransformerPlugin } from "../types"
import remarkBreaks from "remark-breaks"

export const HardLineBreaks: RssgTransformerPlugin = () => {
  return {
    name: "HardLineBreaks",
    markdownPlugins() {
      return [remarkBreaks]
    },
  }
}

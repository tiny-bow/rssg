import sharp from "sharp"
import { joinSegments, RSSG, FullSlug } from "../../util/path"
import { RssgEmitterPlugin } from "../types"
import { write } from "./helpers"
import { BuildCtx } from "../../util/ctx"

export const Favicon: RssgEmitterPlugin = () => ({
  name: "Favicon",
  async *emit({ argv }) {
    const iconPath = joinSegments(RSSG, "static", "icon.png")

    const faviconContent = sharp(iconPath).resize(48, 48).toFormat("png")

    yield write({
      ctx: { argv } as BuildCtx,
      slug: "favicon" as FullSlug,
      ext: ".ico",
      content: faviconContent,
    })
  },
  async *partialEmit() {},
})

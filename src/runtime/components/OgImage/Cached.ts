import { defineComponent } from 'vue'
import type { OgImageOptions } from '../../types'
import { defineOgImageCached } from '#imports'

export default defineComponent<OgImageOptions>({
  name: 'OgImageCached',
  async setup(_, { attrs }) {
    if (process.server)
      await defineOgImageCached(attrs)

    return () => null
  },
})

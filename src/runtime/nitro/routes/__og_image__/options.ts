import { parseURL, withoutTrailingSlash } from 'ufo'
import { defineEventHandler, getQuery } from 'h3'
import type { OgImageOptions } from '../../../../types'
import { getRouteRules } from '#internal/nitro'
import { defaults } from '#nuxt-og-image/config'

export function extractOgImageOptions(html: string) {
  // extract the options from our script tag
  const options = html.match(/<script id="nuxt-og-image-options" type="application\/json">(.+?)<\/script>/)?.[1]
  return options ? JSON.parse(options) : false
}

export const inferOgImageOptions = (html: string) => {
  const options: OgImageOptions = {}
  // extract the og:title from the html
  const title = html.match(/<meta property="og:title" content="(.*?)">/)?.[1]
  if (title)
    options.title = title
  else
    // allow inferences from title
    options.title = html.match(/<title>(.*?)<\/title>/)?.[1]

  // extract the og:description from the html
  const description = html.match(/<meta property="og:description" content="(.*?)">/)?.[1]
  if (description)
    options.description = description
  else
    options.description = html.match(/<meta name="description" content="(.*?)">/)?.[1]
  return options
}

export default defineEventHandler(async (e) => {
  const path = parseURL(e.path).pathname
  if (!path.endsWith('__og_image__/options'))
    return

  const basePath = withoutTrailingSlash(path.replace('__og_image__/options', ''))
  // extract the payload from the original path
  const html = await $fetch<string>(basePath)

  const extractedPayload = extractOgImageOptions(html)
  // not supported
  if (!extractedPayload)
    return false

  // need to hackily reset the event params so we can access the route rules of the base URL
  e.node.req.url = basePath
  e.context._nitro.routeRules = undefined
  const routeRules = getRouteRules(e)?.ogImage
  e.node.req.url = e.path

  // has been disabled via route rules
  if (routeRules === false)
    return false

  return {
    path: basePath,
    ...defaults,
    // use inferred data
    ...inferOgImageOptions(html),
    // use route rules
    ...(routeRules || {}),
    // use provided data
    ...extractedPayload,
    // use query data
    ...getQuery(e),
  } as OgImageOptions
})

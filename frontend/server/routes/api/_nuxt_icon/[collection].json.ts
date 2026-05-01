// @ts-nocheck
/// <reference types="nitropack/types" />

/**
 * Nitro route handler to serve Iconify JSON data from @iconify-json packages
 * Responds to requests like GET /api/_nuxt_icon/heroicons.json
 *
 * This endpoint allows the frontend to fetch icon definitions at runtime
 * without requiring Iconify's public API. Icons are cached aggressively
 * since the JSON data is immutable per collection version.
 */

export default defineEventHandler(async (event) => {
  const collection = getRouterParam(event, "collection");

  // Validate collection name: only lowercase letters and hyphens
  if (!collection || !/^[a-z-]+$/.test(collection)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid collection name",
    });
  }

  try {
    // Dynamically import the icon JSON from @iconify-json/{collection}
    // This works because @iconify-json/heroicons, @iconify-json/lucide, etc.
    // are installed in node_modules and export an icons.json file.
    const iconData = await import(`@iconify-json/${collection}/icons.json`);

    // Set aggressive caching headers since icon data is immutable per version
    setHeader(event, "Cache-Control", "public, max-age=31536000, immutable");
    setHeader(event, "Content-Type", "application/json");

    // Return the icons object (iconData.default is the imported JSON)
    return iconData.default;
  } catch (error) {
    throw createError({
      statusCode: 404,
      statusMessage: `Icon collection "${collection}" not found`,
    });
  }
});

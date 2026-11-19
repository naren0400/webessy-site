/* Eleventy builds the site: the templates in _src/ become the pages in _site/.

       npm run build     build _site/ and check it
       npm start         build, then serve _site/ at http://localhost:8080 and rebuild on save

   Everything else (styles, scripts, fonts, pictures, the hero frames, icons and the few
   server files) is copied into _site/ unchanged, at the same addresses as before. */

// Copied as they are. Folders are copied whole.
const COPY = [
  'css', 'js', 'fonts', 'images', 'frames',
  'favicon.ico', 'favicon.svg', 'apple-touch-icon.png',
  'robots.txt', 'sitemap.xml', 'CNAME', '.htaccess',
];

module.exports = function (eleventyConfig) {
  for (const item of COPY) eleventyConfig.addPassthroughCopy({ [item]: item });

  // A line that holds only a template tag leaves no empty line behind in the page.
  eleventyConfig.setNunjucksEnvironmentOptions({ trimBlocks: true, lstripBlocks: true });

  return {
    dir: { input: '_src', output: '_site', includes: '_includes', data: '_data' },
    templateFormats: ['njk'],
  };
};

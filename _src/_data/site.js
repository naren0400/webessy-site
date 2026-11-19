/* The site's address, for the templates (site.url).
   It is not written here: it is read from tools/set-domain.js, the one place it lives. */
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', '..', 'tools', 'set-domain.js');
const found = fs.readFileSync(file, 'utf8').match(/const SITE = '([^']+)'/);
if (!found) throw new Error('Could not read SITE from tools/set-domain.js');

module.exports = { url: found[1] };

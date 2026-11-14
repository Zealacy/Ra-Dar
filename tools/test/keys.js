// The mountain keys from ../../mountains.js, in file order (drafts already removed), for the tests' defaults.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
module.exports = () => {
  const ctx = {};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', '..', 'mountains.js'), 'utf8') + ';this.K = Object.keys(MOUNTAINS);', ctx);
  return ctx.K;
};

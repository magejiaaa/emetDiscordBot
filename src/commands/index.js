const announce = require('./announce');
const deleteSubmission = require('./deleteSubmission');
const filter = require('./filter');
const forward = require('./forward');
const settings = require('./settings');
const submit = require('./submit');

const commands = [settings, filter, announce, forward, submit, deleteSubmission];

function buildCommandMap() {
  return new Map(commands.map((command) => [command.data.name, command]));
}

module.exports = {
  commands,
  buildCommandMap,
};

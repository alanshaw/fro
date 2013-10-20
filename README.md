fro
===

***DO NOT USE - NOT READY***

Like grunt, but simple stream and transform all the things

bin
---

Use Makefile to invoke fro to perform tasks with config.

* arg0 is plugin name (an installed NPM module)
* arg1 is fro task config file

Task config includes `src` and `dest` directories

fro globs src files and pipes them to plugin

Results are piped from plugin to `dest`


module
---

Just some utilities common to frontend task running?


Usage
===

```sh
npm install -g fro
```

Install a `fro` plugin or any module with a signature of:

```javascript
var through = require('through');
module.exports = function (file) { return through() };
```

For example, brfs.

Create a config file that looks like:

```json
{
  "src": "*.js",
  "dest": "dest/",
  "options": {
    "values": "passed to the task"
  }
}
```

* `src` is a glob specifying files you want to run the task on
* `dest` (optional) is the directory you want to save the output from the files to
* The whole config object is passed to the task as the second param so you can include any other task specific options you like in an `options` property, or whatever.

Then, run the brfs task against the files you specify in your config JSON file:

```sh
fro --task brfs --config brfs.json
```
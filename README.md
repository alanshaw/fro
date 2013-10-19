fro
===

Like grunt, but simple stream and transform all the things


bin
---

Use Makefile to invoke fro to perform tasks with config.

arg0 is plugin name (an installed NPM module)
arg1 is fro task config file

Task config includes `src` and `dest` directories

fro globs src files and pipes them to plugin

Results are piped from plugin to `dest`


module
---

Just some utilities common to frontend task running?
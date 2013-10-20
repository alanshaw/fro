#!/usr/bin/env node

var fs = require("fs")
  , path = require("path")
  , pull = require("pull-stream")
  , glob = require("pull-glob")
  , mkdirp = require("mkdirp")
  , depGraph = require("../lib/dep-graph")

var argv = require("optimist")
  .usage("Stream run frontend tasks.\nUsage: $0")
  .alias("t", "task")
  .alias("c", "config")
  .describe("t", "Task name to run")
  .describe("c", "Config JSON file to load")
  .argv

var tasks = {}
  , config = JSON.parse(fs.readFileSync(argv.c))

// Require tasks and add task name to all instances
Object.keys(config).forEach(function (taskName) {
  tasks[taskName] = require(path.join(process.cwd(), "node_modules", taskName))

  if (Object.keys(config[taskName]).indexOf("src") == -1) {
    return Object.keys(config[taskName]).forEach(function (instanceName) {
      config[taskName][instanceName]._froTaskName = taskName
    })
  }

  config[taskName]._froTaskName = taskName
})

var graph = depGraph.create(config)

depGraph.print(graph)

var globsProcessed = false
  , tasksTotal = 0
  , tasksDone = 0

function onTaskDone () {
  console.log("Task done")
  tasksDone++
  if (globsProcessed && tasksDone == tasksTotal) {
    console.log("ALL DONE")
  }
}

var globProcessingStream = pull.Sink(function (read) {
  read(null, function next (end, file) {
    if (end) {
      globsProcessed = true
      return console.log("Finished processing globs")
    }

    console.log("Processing:", file)
    tasksTotal++

    var dest = path.join(config.dest, file)

    if (!dest) {
      return fs.createReadStream(file).pipe(task(file, config)).on("end", onTaskDone)
    }

    mkdirp(path.dirname(dest), function (er) {
      if (er) throw er
      // Pipe file data to task, then save to dest
      fs.createReadStream(file)
        .pipe(task(file, config))
        .pipe(fs.createWriteStream(dest))
        .on("finish", onTaskDone)
    })

    // Continue reading the files
    read(null, next)
  })
})

// Get src file paths and process task
pull(glob(config.src), globProcessingStream())

#!/usr/bin/env node

var fs = require("fs")
  , path = require("path")
  , pull = require("pull-stream")
  , glob = require("pull-glob")
  , mkdirp = require("mkdirp")
  , async = require("async")
  , depGraph = require("../lib/dep-graph")
  , CombinedStream = require("combined-stream")

var argv = require("optimist")
  .usage("Stream run frontend tasks.\nUsage: $0")
  .alias("t", "task")
  .alias("c", "config")
  .describe("t", "Task name to run")
  .describe("c", "Config JSON file to load")
  .argv

var tasks = {}
  , config = JSON.parse(fs.readFileSync(argv.c))

function isMultiTask (taskConfig) {
  var keys = Object.keys(taskConfig)
  return keys.indexOf("src") == -1 && keys.indexOf("dest") == -1 && keys.indexOf("depends") == -1
}

// Require tasks and add task name to all instances
Object.keys(config).forEach(function (taskName) {
  console.log("Loading task", taskName + "...")
  tasks[taskName] = require(path.join(process.cwd(), "node_modules", taskName))

  if (isMultiTask(config[taskName])) {
    return Object.keys(config[taskName]).forEach(function (instanceName) {
      config[taskName][instanceName]._froTaskName = taskName
    })
  }

  config[taskName]._froTaskName = taskName
})

var graph = depGraph.create(config)

depGraph.print(graph)

function subtaskConfigs (taskConfig) {
  // TODO: Get subtasks for a task
  return []
}

function createTaskPipeline (fromStream, taskConfigs) {
  return taskConfigs.map(function (taskConfig) {
    var subtaskConfigs = subtaskConfigs(taskConfig)
      , task = tasks[taskConfig._froTaskName]

    if (!subtaskConfigs.length) {
      return fromStream.pipe(task(taskConfig))
    }

    return createTaskPipeline(fromStream.pipe(task(taskConfig)), subtaskConfigs)
  })
}

function flatten (array) {
  return array.reduce(function (flattened, o) {
    return flattened.concat(Array.isArray(o) ? flatten(o) : o)
  }, [])
}

// Get the top level tasks
var runners = graph.overallOrder(true).map(function (taskConfig) {
  return function (cb) {
    var globStream = glob(taskConfig.src)
      , sourceStream = CombinedStream.create()

    globStream.on("data", function (file) {
      sourceStream.append(fs.createReadStream(file))
    })

    globStream.on("end", function () {
      var pipeline = createTaskPipeline(sourceStream, [taskConfig])

      // pipeline is an array of streams/arrays of streams - make flatten
      // [stream, [stream, stream], stream, [stream, [stream, stream], stream]]
      pipeline = flatten(pipeline)

      var writeTasks = pipeline.map(function (stream, i) {
        return function (cb) {
          var taskConfig = depGraph.overallOrder()[i]



          var writeStream = fs.createWriteStream(/* but where does it go? */)
          writeStream.on("finish", cb)

          stream.pipe(writeStream)
        }
      })

      async.parallel(writeTasks, cb)
    })
  }
})

async.parallel(runners, function (er) {
  if (er) throw er
})
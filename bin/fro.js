var fs = require("fs")
  , path = require("path")
  , pull = require("pull-stream")
  , glob = require("pull-glob")

var argv = require("optimist")
  .usage("Stream run frontend tasks.\nUsage: $0")
  .demand(["t", "c"])
  .alias("t", "task")
  .alias("c", "config")
  .describe("t", "Task name to run")
  .describe("c", "Config JSON file to load")
  .argv

var task = require(argv.t)
  , config = JSON.parse(fs.readFileSync(argv.c))

var globProcessingStream = pull.Sink(function (read) {
  read(null, function next (end, file) {
    if (end) return console.log("Finished processing globs")
    console.log("Processing:", file)

    // Pipe file data to task, then save to dest
    fs.createReadStream(file)
      .pipe(task(file, config))
      .pipe(fs.createWriteStream(path.join(config.dest, file)))

    // Continue reading the files
    read(null, next)
  })
})

// Get src file paths and process task
glob(config.src).pipe(globProcessingStream())
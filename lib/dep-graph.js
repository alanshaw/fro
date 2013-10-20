var DepGraph = require('dependency-graph').DepGraph

module.exports.create = function (config) {
  var graph = new DepGraph()

  // Add task name to all instances and add instances to graph
  Object.keys(config).forEach(function (taskName) {
    if (Object.keys(config[taskName]).indexOf("src") == -1) {
      return Object.keys(config[taskName]).forEach(function (instanceName) {
        console.log("Adding node", taskName + ":" + instanceName)
        config[taskName][instanceName].toString = function () { return taskName + ":" + instanceName }
        graph.addNode(config[taskName][instanceName])
      })
    }
    console.log("Adding node", taskName)
    config[taskName].toString = function () { return taskName }
    graph.addNode(config[taskName])
  })

  function addDependency (task) {
    if (!task.depends) return;

    if (task.depends.indexOf(":") == -1) {
      if (Object.keys(config[task.depends]).indexOf("src") == -1) {
        Object.keys(config[task.depends]).forEach(function (instanceName) {
          console.log("Adding dependency", task._froTaskName, "->", task.depends + ":" + instanceName)
          graph.addDependency(task, config[task.depends][instanceName])
        })
      } else {
        console.log("Adding dependency", task._froTaskName, "->", task.depends)
        graph.addDependency(task, config[task.depends])
      }
    } else {
      var name = task.depends.split(":")
      console.log("Adding dependency", task._froTaskName, "->", name[0] + ":" + name[1])
      graph.addDependency(task, config[name[0]][name[1]])
    }
  }

  Object.keys(config).forEach(function (taskName) {
    if (Object.keys(config[taskName]).indexOf("src") == -1) {
      return Object.keys(config[taskName]).forEach(function (instanceName) {
        addDependency(config[taskName][instanceName])
      })
    }
    addDependency(config[taskName])
  })

  return graph
}

module.exports.print = function (graph) {
  function print (tasks, level) {
    for (var i = 0; i < tasks.length; ++i) {
      var task = tasks[i]
        , prefix = ""
      if (level) {
        prefix = level + (i == tasks.length - 1 ? " └── " : " ├── ")
      }
      console.log(prefix + task.toString())
      print(graph.incomingEdges[task], level + "  ")
    }
  }

  print(graph.overallOrder(true), "")
}
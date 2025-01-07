# vs-json-macros README

A tool to reduce code volume and repitition on launch.json and tasks.json for vscode using macros in a YAML format.

## Features

### Feature 1: Code deduplication with macros
Imagine you have a launch.json that looks like this:
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "test-local-serialize",
            "type": "cppvsdbg",
            "request": "launch",
            "program": "${workspaceFolder}/build/bin/test_shm_exec.exe",
            "args": "ScalablePageAllocatorMultithreaded",
            "stopAtEntry": false,
            "cwd": "${workspaceFolder}",
            "environment": [],
            "externalConsole": false
        },
        {
            "name": "test-data-structures",
            "type": "cppvsdbg",
            "request": "launch",
            "program": "${workspaceFolder}/build/bin/test_data_structure_exec.exe",
            "args": "ScalablePageAllocatorMultithreaded",
            "stopAtEntry": false,
            "cwd": "${workspaceFolder}",
            "environment": [],
            "externalConsole": false
        },
```

There's a lot of repition there. With vs-json-macros, you can have a YAML file that looks as follows:
```yaml
macros:
  debug:
    name: $(launch-name)
    type: cppdbg
    request: launch
    program: ${workspaceFolder}/build/bin/$(program)
    args: $(args)
    stopAtEntry: false
    cwd: ${workspaceFolder}
    environment: []
    externalConsole: false
    MIMode: gdb
    setupCommands:
      - description: Enable pretty-printing for gdb,
        text: -enable-pretty-printing,
        ignoreFailures: true
version: 0.2.0
configurations:
  - macro: debug
    launch-name: test-local-serialize
    program: test_shm_exec
    args: ["SerializeHshm"]
  - macro: debug
    launch-name: test-data-structures
    program: test_data_structure_exec
    args: ["TestMpmcFifoListQueueIntMultithreaded"]
```

When you run "jsonify" in your developer prompt, it will convert this yaml file to the JSON one and save it as launch.json.
Variables (e.g., launch-name) are defined using the ``$()`` syntax (not ``${}`` like environment variables).

## Feature 2: Code separation into separate yaml files

VSCODE only has one launch.json and one tasks.json. They can get filled with a bunch of stuff if you primarily debug stuff in vsocde. The traditional directory structure of .vscode is as follows:
```
.vscode/
    ├── launch.json
    ├── settings.json
    └── tasks.json
```

With vs-json-macros, you can have a directory structure like this:
```
.vscode/
    ├── launch-dbg-linux.yaml
    ├── launch-dbg-windows.yaml
    ├── launch.json
    ├── settings.json
    └── tasks.json
```

When you run jsonify, it will automatically search for all files beginning with either "launch" or "tasks" and ending in "yaml".
In this case, jsonify will convert launch-dbg-linux.yaml and launch-dbg-windows.yaml into a single launch.json

## Feature 3: Filter out unneeded macros

launch.json and tasks.json may have test cases for different operating systems. You can reduce the volume of test cases by pruning
those belonging to an incompatible OS.

In your YAML file, you could have:
```yaml
requirements:
  os: linux
macros:
  debug:
    name: $(launch-name)
    type: cppdbg
    request: launch
    program: ${workspaceFolder}/build/bin/$(program)
    args: $(args)
    stopAtEntry: false
    cwd: ${workspaceFolder}
    environment: []
    externalConsole: false
    MIMode: gdb
    setupCommands:
      - description: Enable pretty-printing for gdb,
        text: -enable-pretty-printing,
        ignoreFailures: true
version: 0.2.0
configurations:
  - macro: debug
    launch-name: test-local-serialize
    program: test_shm_exec
    args: ["SerializeHshm"]
  - macro: debug
    launch-name: test-data-structures
    program: test_data_structure_exec
    args: ["TestMpmcFifoListQueueIntMultithreaded"]
```

Here the requirements section states that this yaml file is only for linux OSes.
For windows, just type "windows".

## Requirements

None.

## Extension Settings

There are no settings right now. 

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

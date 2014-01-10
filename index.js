#!/usr/bin/env node
var fs = require('fs'),
    path = require('path'),
    archy = require('archy'),
    opts = require('optimist'),
    resolve = require('resolve'),
    detective = require('detective');

var seen = [];

var argv = opts.parse(process.argv);

var files = {};

function sort(basepath, deps) {
  var result = {
    builtins: [],
    modules: [],
    files: []
  };
  deps.forEach(function(item) {
    var fullpath;
    if(resolve.isCore(item)) {
      if(result.builtins.indexOf(item) == -1) {
        result.builtins.push(item);
      }
      return;
    }
    if(item.charAt(0) === '.') {
      fullpath = resolve.sync(item, { basedir: basepath });
      result.files.push(fullpath);
    } else {
      // module
      if(result.modules.indexOf(item) == -1) {
        result.modules.push(item);
      }
    }

  });

  return result;
}

function file(name, parent) {
  var base = path.dirname(name),
      deps = [];

  if(path.extname(name) === '.js') {
    try {
      deps = detective(fs.readFileSync(name).toString());
    } catch(e) {
      console.log('Error while parsing file: ', name);
      throw e;
    }
  }

  // console.log(name, deps);
  var result = sort(base, deps);

  // archy props: .label, .nodes
  result.fullpath = name;
  result.label = path.relative(normPath, name);
  //result.label = path.relative((parent ? path.dirname(parent.fullpath) : normPath), name);
  result.nodes = [];

  files[name] = result;

  if(!parent) {
    tree.push(result);
  } else {
    parent.nodes.push(result);
  }

  result.files.forEach(function(fullpath) {
    if(!seen[fullpath]) {
      seen[fullpath] = true;

      var base = path.dirname(fullpath);
      file(fullpath, result);
    }
  });
}

var tree = [],
    root = resolve.sync(argv.main, { basedir: process.cwd() }),
    normPath = path.dirname(root);

file(root);

console.log(tree[0]);

console.log(tree.map(function(i) { return archy(i); }).join('\n'));

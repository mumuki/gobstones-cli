var gsWeblangCore = require("gs-weblang-core/umd/index.umd");
var Context = gsWeblangCore.Context;
var parser = gsWeblangCore.getParser();
var astReplacer = require("./ast-replacer");
var _ = require("lodash");
var reporter = {}

reporter.getAst = function(code) {
  return JSON.stringify(parser.parseProgram(code), astReplacer, 2);
};

reporter.run = function(code, initialBoard, format) {
  var ast;
  try {
    ast = parser.parseProgram(code)[0];
  } catch (err) {
    return this._tryToDo(function() {
      return {
        status: "compilation_error",
        result: this._buildCompilationError(err)
      };
    }.bind(this));
  }

  var context = new Context();
  if (initialBoard !== undefined) {
    try {
      var board = gsWeblangCore.gbb.reader.fromString(initialBoard);
      _.assign(context.board(), board);
    } catch (err) {
      return this._buildUnknownError(err);
    }
  }

  try {
    var board = ast.interpret(context).board();
    board.table = format === "gbb"
      ? gsWeblangCore.gbb.builder.build(board)
      : board.toView();

    return {
      status: "passed",
      result: board
    }
  } catch (err) {
    return this._tryToDo(function() {
      return {
        status: "runtime_error",
        result: this._buildRuntimeError(err)
      };
    }.bind(this));
  }
};

reporter._buildCompilationError = function(error) {
  if (!error.on || !error.error) throw error;

  return {
    on: error.on,
    message: error.error
  }
};

reporter._buildRuntimeError = function(error) {
  if (!error.on || error.message) throw error;

  error.on = error.on.token;
  return _.pick(error, "on", "message");
};

reporter._buildUnknownError = function(error) {
  return {
    status: "all_is_broken_error",
    message: "Something has gone very wrong",
    detail: error,
    moreDetail: error.message
  }
};

reporter._tryToDo = function(action) {
  try {
    return action()
  } catch (err) {
    return this._buildUnknownError(err);
  }
};

module.exports = reporter
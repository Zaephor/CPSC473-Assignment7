/* jshint node: true, curly: true, eqeqeq: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, nonew: true, quotmark: double, strict: true, undef: true, unused: true */
/***************************************
 * CPSC473 Section 1 - Assignment 7
 * Eric Donaldson + Kyle Meyerhardt
 * Bit.ly/Tinyurl clone using Redis
 * References:
 * Previous Assignments, and our group projects
 * http://getbootstrap.com/
 * http://redis.io/topics/quickstart
 * http://www.sitepoint.com/using-redis-node-js/
 * https://lodash.com/ - "_"
 * https://www.npmjs.com/package/validator - "validator"
 * https://www.npmjs.com/package/string-hash - modified version exists in index.js
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toString
 */

var express = require("express");
var path = require("path");
var favicon = require("serve-favicon");
var logger = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var redis = require("redis");

var routes = require("./routes/index");

var app = express();

// Useful global
global._ = require("lodash");
global.db = redis.createClient(6379, "127.0.0.1");
global.validator = require("validator");

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + "/public/favicon.ico"));
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(require("less-middleware")(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public")));

app.use("/", routes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    "use strict";
    var err = new Error("Not Found");
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get("env") === "development") {
    app.locals.pretty = true; // Pretty output
    app.use(function (err, req, res, next) {
        "use strict";

        res.status(err.status || 500);
        res.render("error", {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    "use strict";
    res.status(err.status || 500);
    res.render("error", {
        message: err.message,
        error: {}
    });
});


module.exports = app;

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
var router = express.Router();

var utility = {
    stringHash: function (str) {
        "use strict";
        // Based on http://www.cse.yorku.ca/~oz/hash.html
        // from NPM module string-hash https://www.npmjs.com/package/string-hash
        // sourcecode avail: https://github.com/darkskyapp/string-hash and tweaked with ideas from
        // And converting to base 36 at https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toString
        var hash = 5381,
            i = str.length;

        while (i){
            hash = (hash * 33) ^ str.charCodeAt(--i);
        }

        return (hash >>> 0).toString(36);
    }
};

/* GET home page. */
router.get("/", function (req, res, next) {
    "use strict";
    res.render("index", {title: "CPSC473-Assignment7 URL Shortner"});
});

/* POST new url to database */
router.post("/submit", function (req, res, next) {
    "use strict";
    // Get posted data
    var path = req.body.path;
    // Validate URL, found validator module in NPM
    if (!validator.isURL(path, {
            require_protocol: true,
            host_blacklist: [req.headers.host, "localhost", "127.0.0.1"]
        }) && validator.isURL("http://" + path, {
            require_protocol: true,
            host_blacklist: [req.headers.host, "localhost", "127.0.0.1"]
        })) {
        path = "http://" + path;
    }
    // Alternate validation could be to perform header check against the URL to confirm the host is real.
    if (validator.isURL(path, {require_protocol: true, host_blacklist: [req.headers.host, "localhost", "127.0.0.1"]})) {
        // Hash the url string
        var hash = utility.stringHash(path);
        var multi = db.multi();
        // We decided that it is ok to give the same code to different end users, since we intend to display a top-10 list,
        // figured it made sense to allow URIs to be reused.
        // submit posted data to redis(setnx, set if Not eXist)
        multi.setnx("url:" + hash, path);
        // Add entry to newest list
        // (0 - current unixtime) results in a negative unixtime.
        // Using a sorted set, this allows us to ignore duplicate new entries(within 10 submissions) and keep entries sorted easily
        multi.zadd(["newest", (0 - _.now()), hash]);
        // Trim to 10 items
        multi.zremrangebyrank("newest", 10, -1);
        // actually execute above actions together/atomically
        multi.exec();
        // return shortened URL
        res.json({shortURL: "http://" + req.headers.host + "/" + hash});
    } else { // Return that URL was bad
        res.json({"error": "URL is considered invalid"});
    }
});

/* Couple quick API points */
router.get("/new10", function (req, res, next) {
    "use strict";
    // Load the full list of newest entries. This list is always trimmed to 10 items so shouldn't be a need to restrict this call too
    db.zrange(["newest", 0, -1], function (err, newIds) {
//        console.log({func:'new10',err:err,newIds:newIds});
        // Get all the URLs for each key in the sorted set also prepend "url:" to each key.
        db.mget(_.map(newIds, function (item) {
            return "url:" + item;
        }), function (err, idData) {
//            console.log(_.zip(newIds,idData));
            // _.zip will take X indexed arrays and create a new array where each variable is grouped by their index value in the order that the arrays were provided
            res.json(_.zip(newIds, idData));
        });
    });
});
router.get("/top10", function (req, res, next) {
    "use strict";
    // Load top 10 entries in sorted count list, to prevent race conditions on updating the sort list, we retain all counts in this key
    db.zrevrange(["count", 0, 9], function (err, topIds) {
//        console.log({func:'top10',err:err,topIds:topIds});
        // Get the values of each key in the list, also prepend "url:" to each key beforehand to actually get results
        db.mget(_.map(topIds, function (item) {
            return "url:" + item;
        }), function (err, idData) {
//            console.log(_.zip(topIds,idData));
            // _.zip will take X indexed arrays and create a new array where each variable is grouped by their index value in the order that the arrays were provided
            res.json(_.zip(topIds, idData));
        });
    });
});

/* Handle invalid hash paths */
router.get("/notfound", function (req, res, next) {
    "use strict";
    // Just display page saying not found, but give user ability to submit links here too
    res.render("notfound", {title: "CPSC473-Assignment7 URL Key Not Found"});
});

/* Catch all other URI's and process them */
router.all("/:hash", function (req, res, next) {
    "use strict";
    var hash = req.params.hash;
    // Look up hash in redis
    db.get("url:" + hash, function (err, result) {
        // If hash is not in database for some reason
        if (err === null && result !== null) {
//            console.log({func:'url-hash',err:err,result:result});
            // Increment hit counter because result was found
            db.zincrby(["count", 1, hash],function(){console.log("Hit! - "+hash)});
            // Forward user to URL
            res.redirect(302,result);
        } else {
            // If not found, redirect to notfound
            res.redirect(404,"/notfound");
        }
    });
});

module.exports = router;

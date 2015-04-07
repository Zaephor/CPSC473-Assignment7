/* jshint browser: true, jquery: true, curly: true, eqeqeq: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, nonew: true, quotmark: double, strict: true, undef: true, unused: true */
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
var shortner = function() {
    "use strict";
    /* Update Top 10 and Newest 10 onscreen */
    var top10 = function(){
        $.getJSON("/top10",function(data){
            updateLists(".mostused",data);
        });
    };
    var new10 = function(){
        $.getJSON("/new10",function(data){
            updateLists(".newest",data);
        });
    };

    /* Updates the two tables that are started on the DOM to contain top10 and newest10 */
    var updateLists = function (objectId, data) {
        var output = $("<tbody/>");
        $.each(data, function (k, v) {
            output.append(
                $("<tr/>").append(
                    $("<td/>").append(
                        $("<a/>").text(data[k][0]).attr("href",window.location.protocol+"//"+window.location.host+"/"+data[k][0])
                    ),
                    $("<td/>").text(data[k][1])
                )
            );
        });
        $(objectId).html(output);
    };

    /* Execute submission */
    var submit = function(){
        var url = $("#shortenURL").val(); // Grab contents of text block
        // Check if URL is valid -- Confirmed on serverside too
        if(!validator.isURL(url,{require_protocol:true,host_blacklist:["localhost","127.0.0.1"]}) && validator.isURL("http://"+url,{require_protocol:true,host_blacklist:["localhost","127.0.0.1"]})){
            url = "http://"+url;
        }
        // Last check if URL is valid, the above appends http:// to the beginning incase that's the problem. Serverside performs same steps to be thorough
        if(validator.isURL(url,{require_protocol:true,host_blacklist:["localhost","127.0.0.1"]})) {
            // POST to server
            $.post("/submit", {path: url}, function (response) {
//            console.log(response);
                if (typeof response.error === "undefined") {
                    // Update screen with new shortened url
                    $(".result").html("<h2 id=\"success\"><a id=\"newURL\" href=\"" + response.shortURL + "\">" + response.shortURL + "</a></h2>");
                } else {
                    $(".result").html("<h2 id=\"error\">" + response.error + "</h2>");
                }
            });
        } else { //Failed validation... ERROR
            $(".result").html("<h2 id=\"error\">URL is considered invalid</h2>");
        }
    };

    /* Click Hooks */
    var clickHooks = function(){
        // Override clicking the submit button
        $("#submit").click(function(event){
            event.preventDefault(); // Block default event
            submit();
            new10();
            top10();
        });
        // Override pressing enter
        $("input#shortenURL").on("keypress",function(event){
            if(event.keyCode === 13){
                event.preventDefault(); // Block default event
                submit();
                new10();
                top10();
            }
        });
    };
    clickHooks();
    top10();
    new10();
};
$(document).ready(shortner);
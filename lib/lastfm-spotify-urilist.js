/*
* lastfm-spotify-urilist
* https://github.com/mikaelbrevik/lastfm-spotify-urilist
*
* Copyright (c) 2012 Mikael Brevik
* Licensed under the MIT license.
*/

var LastFmNode = require('lastfm').LastFmNode,
    spotify = require('spotify'),
    async = require("async"),
    _ = require("underscore");

/**
{
api_key: process.env.SIMPLIFY_LASTFM_API_KEY,
secret: process.env.SIMPLIFY_LASTFM_SECRET
}
*/
var SpotifyURIProvider = exports.SpotifyURIProvider = function (options) {
    this.options = _.extend({}, exports.default_options, options);
    this.lastfm = new LastFmNode(options);
    this.spotify = spotify;
};

exports.default_options = {
    limit: 10,
    stdTrack: 0
};

SpotifyURIProvider.prototype._handleSuccess = function (type, limit, cb) {
    return function (d) {
        if (d.error) {
            return cb(d, null);
        }

        var tracks = d[type].track;

        if (!tracks || tracks.length < 1) {
            return cb.apply("No tracks found", ["No tracks found", null]);
        }

        tracks = (tracks.length > 1) ? tracks : [tracks];

        if (tracks.length > limit) {
            tracks = tracks.splice(0, limit);
        }

        return cb(null, tracks);
    };

},
_handleError = function (cb) {

    return function (e) {
        return cb(e, null);
    };
};

SpotifyURIProvider.prototype.getWeeklyTrackChart = function (user, from, to, limit, cb) {

    this.lastfm.request("user.getWeeklyTrackChart", {
        user: user,
        from: from,
        to: to,
        handlers: {
            success: this._handleSuccess("weeklytrackchart", limit, cb),
            error: _handleError(cb)
        }
    });
};


SpotifyURIProvider.prototype.getLovedTracks = function (user, limit, cb) {
    var self = this;
    this.lastfm.request("user.getLovedTracks", {
        user: user,
        limit: limit || (self.options.limit || 10),
        handlers: {
            success: this._handleSuccess("lovedtracks", limit, cb),
            error: _handleError(cb)
        }
    });
};


SpotifyURIProvider.prototype.getTopTracks = function (user, period, limit, cb) {
    var self = this;
    this.lastfm.request("user.getTopTracks", {
        user: user,
        limit: limit || (self.options.limit || 10),
        period: period || "overall",
        handlers: {
            success: this._handleSuccess("toptracks", limit, cb),
            error: _handleError(cb)
        }
    });
};


SpotifyURIProvider.prototype.getWeeklyChartList = function (user, cb) {
    return this.lastfm.request("user.getWeeklyChartList", {
        user: user,
        handlers: {
            success: function (data) {
                cb(null, data);
            },
            error: _handleError(cb)
        }
    });
};

SpotifyURIProvider.prototype.searchTrackSpotify = function (trackName, cb) {
    // Filter out dangerous URL components
    var self = this;
    trackName = trackName.replace(/[\?&]/g, "");

    return this.spotify.search({type: 'track', query: trackName}, function (err, data) {
        if (err || !data || data.tracks.length < 1) {
            return cb(null, null);
        }

        var trackURI = data.tracks[self.options.stdTrack || 0].href;

        cb(null, trackURI);
    });
};

/**
 * Wrapper method for the .getURI*** methods. Pass in either method name
 * or the suffix (ie. loved, top or weekly) as method and user, options
 * and callback. Method will automaticly fire the appropriate method.
 */
SpotifyURIProvider.prototype.getURIList = function (method, user, options, cb) {

    // Make sure the method is in the right format.
    if (method.substring(0, 6) !== "getURI") {
        method = "getURIList" + method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
    }

    // Check if the method is part of the prototype.
    if (!method || !(method in this)) {
        // Not a part, send error callback
        return cb("No method by name: " + method, null);
    }

    if (typeof options === "function" && !cb) {
        cb = options;
        options = {};
    }

    // Execute selected method with appropriate arguments.
    return this[method](user, options, cb);
};


SpotifyURIProvider.prototype.getURIListLoved = function (user, options, resCb) {
    var self = this,
        fn = function (elm, callback) {
            self.searchTrackSpotify(elm.artist.name + " " + elm.name, callback);
        },
        limit = options.limit || (self.options.limit || 10);

    self.getLovedTracks(user, limit, function (err, data) {
        if (err) {
            return resCb(err, null);
        }
        async.map(data, fn, resCb);
    });
};

SpotifyURIProvider.prototype.getURIListTop = function (user, options, resCb) {
    var self = this,
        fn = function (elm, callback) {
            self.searchTrackSpotify(elm.artist.name + " " + elm.name, callback);
        },
        period = options.period, // can be overall | 7day | 1month | 3month | 6month | 12month
        limit = options.limit || (self.options.limit || 10);

    self.getTopTracks(user, period, limit, function (err, data) {
        if (err) {
            resCb(err, null);
            return;
        }

        async.map(data, fn, resCb);
    });
};

SpotifyURIProvider.prototype.getURIListWeekly = function (user, options, resCb) {
    var self = this,
        fn = function (elm, callback) {
            self.searchTrackSpotify(elm.artist["#text"] + " " + elm.name, callback);
        },
        dateOffset = options.dateOffset || 0,
        limit = options.limit || (self.options.limit || 10);

    this.getWeeklyChartList(user, function (error, data) {

        if (error) {
            return resCb(error, null);
        }

        var dates = data.weeklychartlist.chart,
            from,
            to;

        if (dateOffset >= dates.length || !dateOffset) {
            dateOffset = 0;
        }

        from = dates[dates.length - dateOffset - 1].from;
        to = dates[dates.length - dateOffset - 1].to;

        if (limit < 1) {
            limit = 10;
        }

        self.getWeeklyTrackChart(user, from, to, limit, function (err, data) {
            if (err) {
                return resCb(err, null);
            }

            async.map(data, fn, resCb);
        });
    });

};
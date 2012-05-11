/*
* lastfm-spotify-urilist
* https://github.com/mikaelbrevik/lastfm-spotify-urilist
*
* Copyright (c) 2012 Mikael Brevik
* Licensed under the MIT license.
*/

// Dependencies.
var LastFmNode = require('lastfm').LastFmNode,
    spotify = require('spotify'),
    async = require("async"),
    _ = require("underscore");

/**
 * Constructor of the Spotify URI List Provider module.
 * Options should contain references to api_key and secret for Last.fm API.
 * Options could also contain standard limit for tracks, and standard track to choose
 * if multiple results when searching for a track. In most cases this should be 0.
 *
 * Example init:
 * new lastfm_spotify_urilist.SpotifyURIProvider({
 *   api_key: process.env.SIMPLIFY_LASTFM_API_KEY,
 *   secret: process.env.SIMPLIFY_LASTFM_SECRET
 * });
 *
 */
var SpotifyURIProvider = exports.SpotifyURIProvider = function (options) {
    this.options = _.extend({}, exports.default_options, options);
    this.lastfm = new LastFmNode(options);
    this.spotify = spotify;
};

/**
 * Default options. Can be overridden on initiation, or by altering these
 * values before initiating.
 */
exports.default_options = {
    limit: 10,
    stdTrack: 0
};

/**
 * Private hepler method used to handle success calls to the Last.fm API.
 * Should not be used, but is of public access, due to unit tests.
 */
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

};
var _handleError = function (cb) {

    return function (e) {
        return cb(e, null);
    };
};

/**
 * Get a list of the weekly tracks between interval of specified unix timestamp from and to,
 * and username user. Limit defines how many tracks to fetch.
 *
 * @param user string
 * @param from int unix timestamp
 * @param to int unix timestamp
 * @param limit int
 * @param cb function callback with params err and data.
 */
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

/**
 * Get a list of the loved tracks from Last.fm by username user. Limit defines how many tracks to fetch.
 *
 * @param user string
 * @param limit int
 * @param cb function callback with params err and data.
 */
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

/**
 * Get a list of the top tracks from Last.fm by username user. Limit defines how many tracks to fetch.
 * The period param defines what period to get top tracks from.
 *
 * Period can have following values: overall | 7day | 1month | 3month | 6month | 12month
 *
 * @param user string
 * @param period string
 * @param limit int
 * @param cb function callback with params err and data.
 */
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

/**
 * Can be used to find a list of all intervals the weekly track charts from Last.fm
 * is generated. Gives the callback an object with an array of all intervals (by two properties: from and to)
 *
 * @param user string
 */
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

/**
 * Given a track name, trigger callback with data of the spotify URI.
 *
 * @param trackName string Track title to search for
 * @param cb function callback with params err and data.
 */
SpotifyURIProvider.prototype.searchTrackSpotify = function (trackName, cb) {
    // Filter out dangerous URL components
    var self = this;
    trackName = trackName.replace(/[\?&]/g, "");

    async.series([
        self.hooks.preFetchTrackURI(trackName)
    ],
    function (err, results) {

        if (err || results[0]) {
            return cb(err, results[0]);
        }

        return self.spotify.search({type: 'track', query: trackName}, function (err, data) {
            if (err || !data || data.tracks.length < 1) {
                return cb(null, null);
            }

            var trackURI = data.tracks[self.options.stdTrack || 0].href;
            self.hooks.postFetchTrackURI(trackName, trackURI);
            cb(null, trackURI);
        });
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


// DRY. Used by the getURIList methods to handle response.
var _handleResponseFromLastFM = function (fn, resCb) {
    return function (err, data) {
        if (err) {
            return resCb(err, null);
        }
        async.map(data, fn, resCb);
    };
};

/**
 * Get a Spotify URI list from loved tracks from user 'user'.
 * If track couldn't be found in Spotify, this element in the list will be null.
 *
 * @param user string
 * @param options object Options object, with property limit
 * @resCb function callback(err, URIList)
 */
SpotifyURIProvider.prototype.getURIListLoved = function (user, options, resCb) {
    var self = this,
        fn = function (elm, callback) {
            self.searchTrackSpotify(elm.artist.name + " " + elm.name, callback);
        },
        limit = options.limit || (self.options.limit || 10);

    self.getLovedTracks(user, limit, _handleResponseFromLastFM(fn, resCb));
};


/**
 * Get a list of Spotify URIs from the Last.fm on top list to an user 'user'.
 * Options object can have limit and period. Limit is a int defining number of URIs to show.
 * The period is from what period the top list should be based on.
 *
 * Period can have following values: overall | 7day | 1month | 3month | 6month | 12month
 *
 * If track couldn't be found in Spotify, this element in the list will be null.
 *
 * @param user string
 * @param options object Options object, with properties: limit and period
 * @resCb function callback(err, URIList)
 */
SpotifyURIProvider.prototype.getURIListTop = function (user, options, resCb) {
    var self = this,
        fn = function (elm, callback) {
            self.searchTrackSpotify(elm.artist.name + " " + elm.name, callback);
        },
        period = options.period,
        limit = options.limit || (self.options.limit || 10);

    self.getTopTracks(user, period, limit, _handleResponseFromLastFM(fn, resCb));
};

/**
 * Get a list of Spotify URIs from the Last.fm weekly chart list to an user 'user'.
 * Options object can have limit and dateOffset. Limit is a int defining number of URIs to show.
 *
 * The date offset defines the week to get the chart list from. E.g. dateOffset of 1
 * will result in 1 week ago, 2 for two weeks ago, and so on. Default value is 0 (latest week).
 *
 * If track couldn't be found in Spotify, this element in the list will be null.
 *
 * @param user string
 * @param options object Options object, with properties: limit and date offset
 * @resCb function callback(err, URIList)
 */
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

        self.getWeeklyTrackChart(user, from, to, limit, _handleResponseFromLastFM(fn, resCb));
    });

};

/**
 * These hooks can be used to cache track searches. There are two hooks as for now:
 *   - preFetchTrackURI(string: trackName)
 *   - postFetchTrackURI(string: trackName, string: trackURI)
 *
 * The preFetchTrackURI must return a function taking callback as parameter.
 * This callback must be called within this function. The second argument of
 * this callback will be the result of the spotify track search.
 * These hooks can be used for caching.
 *
 * The postFetchTrackURI shouldnt return a function. Just execute what ever
 * you cant within it's function. E.g. save trackURI to a cache server.
 */
SpotifyURIProvider.prototype.hooks = {
    preFetchTrackURI: function (spotifyTrackName) {
        return function (callback) {
            callback(null, null);
        };
    },
    postFetchTrackURI: function (spotifyTrackName, trackURI) {}
};

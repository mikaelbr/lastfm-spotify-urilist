var lastfm_spotify_urilist = require('../lib/lastfm-spotify-urilist.js');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports['spotifyuriprovider'] = {
  setUp: function(done) {
    // setup here

    lastfm_spotify_urilist.default_options.limit = 11;
    this.provider = new lastfm_spotify_urilist.SpotifyURIProvider({
      api_key: process.env.SIMPLIFY_LASTFM_API_KEY,
      secret: process.env.SIMPLIFY_LASTFM_SECRET
    });

    done();
  },
  'method exists': function(test) {
    test.expect(1);
    // tests here
    test.ok(this.provider, 'should be function.');
    test.done();
  },
  'standard options set': function(test) {
    test.expect(2);
    // tests here
    test.deepEqual(lastfm_spotify_urilist.default_options, {
        limit: 11,
        stdTrack: 0
    }, 'have standard options set.');
    // tests here
    test.strictEqual(this.provider.options.limit, 11, 'have standard options set in instance.');
    test.done();
  },
  'search track': function(test) {
    test.expect(1);

    this.provider.searchTrackSpotify("superfamily", function (err, data) {
      test.strictEqual(data, "spotify:track:3BbfQLpcj0BfjM5rq8Ioj9", "track is gettable");
      test.done();
    });
  },
  'top list': function(test) {
    test.expect(1);

    this.provider.getURIList("top", "mikaelb1", function (err, data) {
      test.ok(data.length > 0, "no error");
      test.done();
    });
  },
  'weekly list': function(test) {
    test.expect(1);

    this.provider.getURIList("weekly", "mikaelb1", function (err, data) {
      test.ok(data.length > 0, "no error");
      test.done();
    });
  },
  'loved list': function(test) {
    test.expect(1);

    this.provider.getURIList("loved", "mikaelb1", function (err, data) {
      test.ok(data.length > 0, "no error");
      test.done();
    });
  }
};

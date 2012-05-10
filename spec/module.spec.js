var lastfm_spotify_urilist = require('../lib/lastfm-spotify-urilist.js'),
    fs = require('fs');


var getFixtureData = function (file) {
  var file = fs.readFileSync(file, 'utf8');
  return JSON.parse(file);
}

lastfm_spotify_urilist.default_options.limit = 11;
var provider = new lastfm_spotify_urilist.SpotifyURIProvider({
  api_key: "Foo",
  secret: "Bar"
});

describe("Spotify URI from Last.fm Provider: Basics", function() { 

  it("should be defined as an object", function (done) {
    expect(provider).toBeDefined();
    done();
  });

  it("should have default settings set", function (done) {
    expect(provider.options.limit).toBe(11);
    expect(provider.options.stdTrack).toBe(0);
    done();
  });

});


describe("AJAX Calls", function () {

  beforeEach(function() {
    spyOn(provider.spotify, 'search').andCallFake(function (query, cb) {
      return cb(null, getFixtureData('spec/fixtures/trackSearch.json'));
    });
  });

  it("should be able to search for track", function (done) {

    provider.searchTrackSpotify("Foo", function (err, data) {
      expect(data).toBe('spotify:track:3BbfQLpcj0BfjM5rq8Ioj9');
      done();
    });

  });

  it("should be able to get loved tracks", function (done) {
    spyOn(provider, 'getLovedTracks').andCallFake(function (user, limit, cb) {
      var res = provider._handleSuccess("lovedtracks", limit, cb);
      return res(getFixtureData('spec/fixtures/loved.json'));
    });

    provider.getURIListLoved("foo", {}, function (err, data){
      expect(data).toBeDefined();
      expect(data).toContain('spotify:track:3BbfQLpcj0BfjM5rq8Ioj9');
      done();
    });
  });

  it("should be able to get top tracks", function(done) {
    spyOn(provider, 'getTopTracks').andCallFake(function (user, period, limit, cb) {
      var res = provider._handleSuccess("toptracks", limit, cb)
      return res(getFixtureData('spec/fixtures/top.json'));
    });

    provider.getURIListTop("foo", {}, function (err, data){
      expect(data).toBeDefined();
      expect(data).toContain('spotify:track:3BbfQLpcj0BfjM5rq8Ioj9');
      done();
    });
  });

  it("should be able to get weekly tracks", function(done) {

    spyOn(provider, 'getWeeklyChartList').andCallFake(function (user, cb) {
      return cb(null, getFixtureData('spec/fixtures/weeklyTimestamps.json'));
    });

    spyOn(provider, 'getWeeklyTrackChart').andCallFake(function (user, from, to, limit, cb) {
      var res = provider._handleSuccess("weeklytrackchart", limit, cb);
      return res(getFixtureData('spec/fixtures/weekly.json'));
    });

    provider.getURIListWeekly("foo", {}, function (err, data){
      expect(data).toBeDefined();
      expect(data).toContain('spotify:track:3BbfQLpcj0BfjM5rq8Ioj9');
      done();
    });
  });

});

// > var lastfm_spotify_urilist = require(process.env.PWD + '/lib/lastfm-spotify-urilist.js');
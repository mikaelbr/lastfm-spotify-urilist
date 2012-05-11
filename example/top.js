var lastfm_spotify_urilist = require('../lib/lastfm-spotify-urilist.js');

lastfm_spotify_urilist.default_options.limit = 11;
var provider = new lastfm_spotify_urilist.SpotifyURIProvider({
    api_key: process.env.SIMPLIFY_LASTFM_API_KEY,
    secret: process.env.SIMPLIFY_LASTFM_SECRET
});

provider.getURIListTop("mikaelb1", {}, function (err, data){
    console.log(err, data);
});
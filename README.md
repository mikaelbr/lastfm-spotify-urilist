# lastfm-spotify-urilist

__A work in progress for trying to fork out a module from the [Simplify Play Button project](https://github.com/mikaelbr/simplify-playbutton).__

An easy way of getting a list of Spotify URIs based on Last.fm data (top/loved tracks and weekly chart list of tracks).

## Getting Started
Install the module with: `npm install lastfm-spotify-urilist`

```javascript
var lsu = require('lastfm-spotify-urilist'),
    tracksProvider = new lsu.SpotifyURIProvider({
        api_key: process.env.SIMPLIFY_LASTFM_API_KEY,
        secret: process.env.SIMPLIFY_LASTFM_SECRET
    });
```

## Documentation
_(Coming soon)_

## Examples
Having the tracksProvider object, as defined above, use this simple code to get the loved tracks of a user:

```javascript
tracksProvider.getURIList("loved", "mikaelb1", function (err, data) {
    console.log(data); // List of Spotify URIs from Loved tracks on Last.fm 
});

```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [grunt](https://github.com/cowboy/grunt).

## Release History
_(Nothing yet)_

## License
Copyright (c) 2012 Mikael Brevik  
Licensed under the MIT license.

import cheerio from 'cheerio';
import Boilerpipe from 'boilerpipe';
import request from 'request-promise-native';
import FeedParser from 'feedparser';

function scrapeWebPage(url) {
  return new Promise((resolve, reject) => new Boilerpipe({url}).getText((err, text) => (err) ? reject(err) : resolve(text)));
}

function scrapeRss(url) {
  const feedparser = new FeedParser();
  const items = [];
  const stream = request(url)
  .pipe(feedparser)
  .on('readable', function() {
    const stream = this;
    var item;
    while(item = stream.read()) { 
      items.push(item); 
    }
  });
  return new Promise(resolve => {
    stream.on('end', () => resolve(items))
    stream.on('error', (err) => reject(err));
  });
}

function cleanHTML(html) {
  return new Promise((resolve,reject) =>
    new Boilerpipe({html}).getText((err, text) => (err) ? reject(err): resolve(text)));
}

export class Feed {
  constructor(name, url, cache) {
    this._cache = cache;
    this._name = name;
    this._url = url;
  }
  getItems() {
    return scrapeRss(this._url)
    .catch(err => {
      console.error('Scrape failure', err, this._url);
      return [];
    })
    .then(items => items.map(item => {
      const {link: url, title, author, pubDate, date: feedDate} = item;
      const rawDescription = item.description || item.summary;
      var descriptionP = Promise.resolve(null);
      if(rawDescription) {
        descriptionP = cleanHTML(rawDescription);
      } 
      return this._cache.checkSeen(url).then(seen => {
        if(seen === true) { return null; }
        console.log('Scraping new page', url);
        return scrapeWebPage(url)
        .catch(err => console.error('URL FAILED', url, err))
        .then(pageContents => descriptionP.then(description =>
          ({
            title, author, url, description, pageContents,
            pubDate, feedDate,
          })
        ));
      });
    }));
  }
}

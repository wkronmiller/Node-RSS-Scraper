import cheerio from 'cheerio';
import Boilerpipe from 'boilerpipe';
import request from 'request-promise-native';
import FeedParser from 'feedparser';

function scrapeWebPage({title, href}) {
  return new Promise((resolve, reject) => new Boilerpipe({url: href}).getText((err, text) => (err) ? reject(err) : resolve(text)))
  .then(text => ({title, text}));
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
  return new Promise(resolve => stream.on('end', () => resolve(items)));
}

function cleanHTML(html) {
  return new Promise((resolve,reject) =>
    new Boilerpipe({html}).getText((err, text) => (err) ? reject(err): resolve(text)));
}

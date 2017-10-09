import {Index} from './indexer';
import {Feed} from './scraper';

const config = {
  elasticsearch: {
    indexName: 'rss-feeds',
    host: 'http://elasticsearch.cloud.kronmiller.net:32000',
  },
};

const feeds = {
  politico: {
    congress: 'http://www.politico.com/rss/congress.xml',
    healthcare: 'http://www.politico.com/rss/defense.xml',
    politics: 'http://www.politico.com/rss/politics08.xml',
  },
  reuters: {
    business: 'http://feeds.reuters.com/reuters/businessNews',
    mostRead: 'http://feeds.reuters.com/reuters/MostRead',
  },
  cnbc: {
    top: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
  },
  motorTrend: 'http://www.motortrend.com/widgetrss/motortrend-stories.xml',
  nyTimes: {
    homePage: 'http://www.nytimes.com/services/xml/rss/nyt/HomePage.xml',
    business: 'http://feeds.nytimes.com/nyt/rss/Business',
  },
  aviationWeek: {
    space: 'http://awin.aviationweek.com/RssFeed.aspx?rss=true&key=space',
  },
  defenseNews: {
    space: 'http://feeds.feedburner.com/defense-news/space',
    congress: 'http://feeds.feedburner.com/defense-news/congress',
    pentagon: 'http://feeds.feedburner.com/defense-news/pentagon',
  },
  theHill: 'http://thehill.com/rss/syndicator/19109',
};

const index = (() => {
  const {elasticsearch} = config;
  return new Index(elasticsearch.host, elasticsearch.indexName);
})();

const feedList = (function makeFeeds(feedObj) {
  return Object.keys(feedObj)
    .map(key => {
      const value = feedObj[key];
      if (typeof value === 'string') {
        return [new Feed(key, value)];
      }
      return makeFeeds(value);
    })
  .reduce((a,b) => a.concat(b));
})(feeds);

function indexFeed(feed) {
  const ready = feed.getItems().then(items => Promise.all(items)).then(items => items.map(index.prepare.bind(index)));
  return ready.then(() => index.flush())
}

feedList.map(indexFeed).map(p => p.catch(console.error));

import {Index} from './indexer';
import {Feed} from './scraper';
import {Cache} from './cache';

const config = {
  indexName: 'rss-feeds',
  elasticsearch: {
    host: 'http://elasticsearch:9200',
  },
  redis: {
    host: 'redis',
    port: 6379,
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
  miniMania: {
    recentArticles: 'http://feeds.feedburner.com/minimaniaRecentMINIArticles',
    newProducts: 'http://feeds.feedburner.com/RecentlyAddedMiniProducts-MiniMania',
  },
  //northAmericanMotoring: 'http://www.northamericanmotoring.com/forums/external.php',
  washingtonPost: {
    national: 'http://feeds.washingtonpost.com/rss/national',
    world: 'http://feeds.washingtonpost.com/rss/world',
    business: 'http://feeds.washingtonpost.com/rss/business',
  },
  cnn: {
    top: 'http://rss.cnn.com/rss/cnn_topstories.rss',
    us: 'http://rss.cnn.com/rss/cnn_us.rss',
  },
  aviationWeek: {
    space: 'http://awin.aviationweek.com/RssFeed.aspx?rss=true&key=space',
  },
  defenseNews: {
    space: 'http://feeds.feedburner.com/defense-news/space',
    congress: 'http://feeds.feedburner.com/defense-news/congress',
    pentagon: 'http://feeds.feedburner.com/defense-news/pentagon',
    air: 'http://feeds.feedburner.com/defense-news/air',
  },
  defenceTalk: {
    security: 'http://feeds2.feedburner.com/defense-security',
    technology: 'http://feeds2.feedburner.com/defense-technology',
  },
  theHill: 'http://thehill.com/rss/syndicator/19109',
  wired: {
    topStories: 'https://www.wired.com/feed/rss',
  },
  hackerNews: {
    frontPage: 'https://hnrss.org/frontpage',
  },
  techCrunch: 'http://feeds.feedburner.com/TechCrunch/',
};

const cache = (() => {
  const {indexName, redis} = config;
  return new Cache(indexName, redis);
})();

const index = (() => {
  const {elasticsearch, indexName} = config;
  return new Index(elasticsearch.host, indexName, cache);
})();

const feedList = (function makeFeeds(feedObj) {
  return Object.keys(feedObj)
    .map(key => {
      const value = feedObj[key];
      if (typeof value === 'string') {
        return [new Feed(key, value, cache)];
      }
      return makeFeeds(value);
    })
  .reduce((a,b) => a.concat(b));
})(feeds);

function indexFeed(feed) {
  return feed.getItems()
  .catch(err => { console.error(err); return []; })
  .then(items => Promise.all(items)).then(items => Promise.all(items.map(index.prepare.bind(index))))
  .catch(err => console.error('Failed to prepare feed', feed, err));
}

(function main() {
  return Promise.all(feedList.map(indexFeed).map(p => p.catch(console.error)))
    .catch(err => console.log('Feed load error', err))
    .then(() => index.flush())
    .catch(err => console.error('Flush failed', err))
    .then(() => cache.close());
})()

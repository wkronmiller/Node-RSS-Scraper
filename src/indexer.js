import elasticsearch from 'elasticsearch';
import redis from 'redis';

function lPush(client, key, values) {
  return new Promise((resolve, reject) => client.lpush(key, values.map(JSON.stringify), (err, res) => (err) ? reject(err): resolve(res)));
}

class Cache {
  constructor() {
    this._redis = redis.createClient():
  }
}

export class Index {
  constructor(host, indexName) {
    this._redis = redis.createClient();
    this._client = new elasticsearch.Client({
      host,
      log: 'warning',
    });
    this._indexName = indexName;
  } 
  close() {
    this._redis.quit();
  }
  // Return true if new
  _addSeen(key) {
    return new Promise((resolve, reject) => this._redis.sadd(`seen:${this._indexName}`, key, (err, res) => (err) ? reject(err): resolve(res)))
      .then(numChanged => numChanged > 0);
  }
  prepare(body) {
    const {url} = body;
    const header = {
      index : {
        _index: this._indexName,
        _type: 'rssItem',
        _id: url
      },
    };
    return this._addSeen(url).then(isNew => {
      if(isNew) {
        // Pushed in reverse order
        return lPush(this._redis, this._indexName, [body, header]);
      }
      return null;
    });
  }
  flush() {
    return new Promise((resolve, reject) => this._redis.lrange(this._indexName, 0, -1, (err, res) => (err) ? reject(err) : resolve(res)))
    .then(items => items.map(JSON.parse))
    .then(body => (body.length > 0) ? this._client.bulk({body}) : null)
    .then(console.log)
    .then(() => new Promise((resolve, reject) => this._redis.del(this._indexName, (err, res) => (err) ? reject(err) : resolve(res))))
    .then(() => console.log('Cleared feed cache'));
  }
  format() {
    const config = {
      index: this._indexName,
      body: {
        mappings: {
          rssItem: {
            properties: {
              title: { type: 'text' },
              author: { type: 'keyword' },
              url: { type: 'text', index: false },
              description: { 
                type: 'text',
                analyzer: 'stop',
              },
              pageContents : { 
                type: 'text', 
                analyzer: 'stop',
              },
              rawPageContents: { type: 'text', index: false },
              pubDate: { type: 'date' },
              feedDate: { type: 'date' },
            },
          },
        },
      },
    };
    return this._client.indices.create(config);
  }
}

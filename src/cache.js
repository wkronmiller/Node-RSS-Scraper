import redis from 'redis';

export class Cache {
  constructor(indexName) {
    this._indexName = indexName;
    this._redis = redis.createClient();
  }
  addItems(key, values) {
    return new Promise((resolve, reject) => this._redis.lpush(key, values.map(JSON.stringify), (err, res) => (err) ? reject(err): resolve(res)));
  }
  getItems() {
    return new Promise((resolve, reject) => this._redis.lrange(this._indexName, 0, -1, (err, res) => (err) ? reject(err) : resolve(res)));
  }
  clearItems() {
    return new Promise((resolve, reject) => this._redis.del(this._indexName, (err, res) => (err) ? reject(err) : resolve(res)));

  }
  // Return true if new
  addSeen(key) {
    return new Promise((resolve, reject) => this._redis.sadd(`seen:${this._indexName}`, key, (err, res) => (err) ? reject(err): resolve(res)))
      .then(numChanged => numChanged > 0);
  }
  close() {
    this._redis.quit();
  }
}

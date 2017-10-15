import elasticsearch from 'elasticsearch';

export class Index {
  constructor(host, indexName, cache) {
    this._cache = cache;
    this._client = new elasticsearch.Client({
      host,
      log: 'warning',
    });
    this._indexName = indexName;
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
    return this._cache.addSeen(url).then(isNew => {
      if(isNew) {
        // Pushed in reverse order
        return this._cache.addItems(this._indexName, [body, header]);
      }
      return null;
    });
  }
  flush() {
    return this._cache.getItems()
    .then(items => items.map(JSON.parse))
    .then(body => (body.length > 0) ? this._client.bulk({body}) : null)
    .then(console.log)
    .then(() => this._cache.clearItems())
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

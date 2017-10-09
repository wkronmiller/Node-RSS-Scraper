import elasticsearch from 'elasticsearch';

export class Index {
  constructor(host, indexName) {
    this._client = new elasticsearch.Client({
      host,
      log: 'warning',
    });
    this._indexName = indexName;
    this._indexBuffer = [];
  } 
  prepare(body) {
    const {url} = body;
    this._indexBuffer.push({
      index : {
        _index: this._indexName,
        _type: 'rssItem',
        _id: url
      },
    });
    this._indexBuffer.push(body);
  }
  flush() {
    return this._client.bulk({body: this._indexBuffer }).then(() => (this._indexBuffer = []));
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

//TODO

}

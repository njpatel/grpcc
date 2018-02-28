let metadata = createMetadata({ this: 'is', my: 'metadata' });
client.sayHello({ sayWhat: 'hello' }, metadata, pr)
  .on('metadata', pm);

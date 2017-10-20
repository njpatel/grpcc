client.sayServerStream({})
  .on('data', streamReply)
  .on('status', streamReply);

let call = client.sayBidirectionalStream({})
  .on('data', streamReply);

let i = 0;
let id = setInterval(() => {
  if (i > 5) {
    clearInterval(id);
    return call.end();
  }
  i++;
  call.write({ sayWhat: `hello ${i}` });
}, 100);

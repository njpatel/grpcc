var call = client.sayClientStream({}, pr);
let i = 0;
let id = setInterval(() => {
  if (i > 5) {
    clearInterval(id);
    return call.end();
  }
  i++;
  call.write({ sayWhat: `hello ${i}` });
}, 100);

const attachresHelpers = (res) => {
  res.json = (data, status = 200) => {
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
    });
    res.end(JSON.stringify(data));
  };
};

export const createApp = () => {
  const layers = [];

  const add = (method, path, handler) => {
    layers.push({ method, path, handler });
  };

  const use = (handler) => add(null, null, handler);
  const get = (path, handler) => add("GET", path, handler);
  const post = (path, handler) => add("POST", path, handler);

  const handle = async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    req.path = url.pathname;
    req.query = Object.fromEntries(url.searchParams.entries());

    attachresHelpers(res);

    let index = -1;

    const next = async () => {
      index += 1;
      const layer = layers[index];

      if (!layer) {
        if (!res.headersSent) {
          res.statusCode = 404;
          res.end();
        }
        return;
      }

      const methodMatches = layer.method === null || layer.method === req.method;
      const pathMatches = layer.path === null || layer.path === req.path;
      if (!methodMatches || !pathMatches) {
        await next();
        return;
      }

      await layer.handler(req, res, next);
    };

    await next();
  };

  return {
    use,
    get,
    post,
    handle,
  };
};

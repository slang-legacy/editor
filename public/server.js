(function() {
  var dnode, http, server, shoe, sock;

  http = require("http");

  shoe = require("shoe");

  dnode = require("dnode");

  server = http.createServer();

  server.listen(3000);

  sock = shoe(function(stream) {
    var d;

    d = dnode({
      transform: function(s, cb) {
        var res;

        res = s.replace(/[aeiou]{2,}/, "oo").toUpperCase();
        return cb(res);
      }
    });
    return d.pipe(stream).pipe(d);
  });

  sock.install(server, "/dnode");

}).call(this);

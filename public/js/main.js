(function() {
  require.config({
    paths: {
      jquery: 'jquery'
    }
  });

  require(['jquery'], function($) {
    return $(function() {
      var d, result, stream;

      stream = shoe("http://localhost:3000/dnode");
      result = document.getElementById('result');
      d = dnode();
      d.on("remote", function(remote) {
        return remote.transform("beep", function(s) {
          return result.textContent = "beep => " + s;
        });
      });
      return d.pipe(stream).pipe(d);
    });
  });

}).call(this);

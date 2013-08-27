;(function(exports) {
  var opts = {
    value: function(d) { return d.city; },
    display: function(d, val) {
      var emphasize = new RegExp("("+val+")",'i');
      return d.city.replace(emphasize, "<strong>$1</strong>")+" ("+d.cc+")";
    }
  };

  var autocomplete = new Autocomplete('input', data, opts);
})(this);

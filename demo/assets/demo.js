;(function(exports) {

  var opts = {
    value: function(d) { return d.city; },
    display: function(d, val) {
      var emphasize = new RegExp("("+val+")",'i');
      return d.city.replace(emphasize, "<strong>$1</strong>")+" ("+d.cc+")";
    },
    validation: true
  };


  var colors = ["blue", "green", "red", "orange", "purple", "yellow"];
  window.colors = new Frogcomplete('input#colors', colors);

  new Frogcomplete('input#timezones', timezones, {
    value: function(datum) { return datum.city; }
  });

  new Frogcomplete('input#timezones2', timezones, {
    value: function(d) { return d.city; },
    display: function(datum, input) {
      var transform = new RegExp("(" + input + ")", "i");
      return datum.city.replace(transform, "<span style='color: red;'>$1</span>");
    }
  });

  var validate = new Frogcomplete('input#timezones3', timezones, {
    value: function(d) { return d.city; },
    validation: true
  });
  document.querySelector('form#formToValidate').addEventListener('submit', function(){
    if(validate.isInputValid()) {
      alert("the form is valid and submitted");
    }
  });

  new Frogcomplete('input#timezones4', timezones, {
    value: function(d) { return d.city; },
    validation: '#buttonTimezones4',
    validateTrigger: 'click'
  });

  window.test = function() {
    var evt = document.createEvent('CustomEvent'); // MUST be 'CustomEvent'
    evt.initCustomEvent('getAutocomplete', true, true, {detail: {data: 'fooo'}});
    document.querySelector('input').dispatchEvent(evt);
  };

})(this);

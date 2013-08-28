
// change this if you want more logs on the automated tests
var globalOpts = {verbose: false};

// polyfill for new Event() in phantomJS, see
// https://github.com/ariya/phantomjs/issues/11289
var removeEvent = document.createEvent('CustomEvent');  // MUST be 'CustomEvent'
removeEvent.initCustomEvent('removeAutocomplete', false, false, null);

module("Creation and destruction", {
  setup: function(){
    this.target = 'input#target';
  },
  teardown: function() {
    var node = document.querySelector(this.target);

    node.dispatchEvent(removeEvent);
  }
});

test("Invalid target element", function() {
  throws(function(){new Autocomplete(null, null, globalOpts);}, "Cannot create the widget without a target");
  throws(function(){new Autocomplete('doesntexist', null, globalOpts);}, "Cannot create the widget with an invalid dom selector");
});

test("Valid target selector", function() {
  var auto1 = new Autocomplete(this.target, [], globalOpts);
  ok(auto1, "Can pass a valid selector");
});

test("Destruction", function() {
  var auto = new Autocomplete(this.target, [], globalOpts);
  ok(auto , "Sanity test, ");
  ok(document.querySelector('ul.suggestion'), "List of suggestion added to the dom");
  document.querySelector(this.target).dispatchEvent(removeEvent);
  equal(document.querySelector('ul.suggestion'), null, "suggestion list removed");
});

test("Valid DOM element", function(){
  var domTarget = document.querySelector(this.target);
  ok(new Autocomplete(domTarget, [], globalOpts), "Can also directly pass the dom node");
  domTarget.dispatchEvent(removeEvent);
});

test("No data passed", function() {
  throws(function(){new Autocomplete(this.target, null, globalOpts);}, "Cannot create the widget without valid data");

  throws(function(){new Autocomplete(this.target, "foo", globalOpts);}, "Data should be an array, not a string");
  throws(function(){new Autocomplete(this.target, {}, globalOpts);}, "Data should be an array, not an object");
});


module("Filtering data", {
  setup: function() {
    var data = [
      "Bulbasaur", "Mew", "Pikachu"
    ];
    this.data = data;
    this.target = document.querySelector('input#target');
    this.target.value = '';
    this.autocomplete = new Autocomplete(target, data, globalOpts);
    window.autocomplete = this.autocomplete;
  },

  teardown: function() {
    this.target.dispatchEvent(removeEvent);
  }
});

test("No search query", function() {
  var allData = this.autocomplete._getFilteredData();
  equal(allData.length, 0, "No data match an empty query");
});

test("With some user input", function() {
  this.target.value = "no data for this one";
  equal(this.autocomplete._getFilteredData().length, 0, "No data for the wrong input");

  target.value = "Bul";
  deepEqual(this.autocomplete._getFilteredData(), ["Bulbasaur"], "Match result");

  target.value = "basa";
  deepEqual(this.autocomplete._getFilteredData(), ["Bulbasaur"], "Match anywhere in the data");

  target.value = "a";
  deepEqual(this.autocomplete._getFilteredData(), ["Bulbasaur", "Pikachu"], "Returns all matching data");
});

module("Custom accessor function for filteredData");

test("With a custom accessor function", function() {
  data = [ {name: "Bulbasaur"}, {name: "Mew"} ];
  globalOpts.value = function(d) { return d.name; };
  var target = document.querySelector('input#target');
  var autocomplete = new Autocomplete(target, data, globalOpts);
  target.value = "bul";
  deepEqual(autocomplete._getFilteredData(), [{name: "Bulbasaur"}], "Can specify custom accessor for complex data.");

  delete globalOpts.value;
  target.dispatchEvent(removeEvent);
});

module("List of suggestions", {
  setup: function() {
    var data = [
      "Bulbasaur1", "Bulbasaur2", "Bulbasaur3", "Bulbasaur4", "Bulbasaur5", "Bulbasaur6", "Mew", "Pikachu"
    ];
    this.data = data;
    this.target = document.querySelector('input#target');
    this.target.value = '';
    this.autocomplete = new Autocomplete(target, data, globalOpts);
    window.autocomplete = this.autocomplete;
  },

  teardown: function() {
    this.target.dispatchEvent(removeEvent);
  }
});

// test("Display list of suggestions", function() {
//   this.target.value = "bulba";
//   var children = document.querySelector('ul.suggestion').children;
//   equal(children.length, 6, "only show 5 suggestion by default");
// });


// change this if you want more logs on the automated tests
var globalOpts = {verbose: false};

// polyfill for new Event() in phantomJS, see
// https://github.com/ariya/phantomjs/issues/11289
var createEvent = function(name) {
  var evt = document.createEvent('CustomEvent'); // MUST be 'CustomEvent'
  evt.initCustomEvent(name, true, false, null);
  return evt;
};


// utility
var simulateInput = function(el, input) {
  el.value = input;
  el.dispatchEvent(createEvent('change'));
};

module("Creation and destruction", {
  setup: function(){
    this.target = 'input#target';
  },
  teardown: function() {
    var node = document.querySelector(this.target);

    node.dispatchEvent(createEvent('removeAutocomplete'));
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
  document.querySelector(this.target).dispatchEvent(createEvent('removeAutocomplete'));
  equal(document.querySelector('ul.suggestion'), null, "suggestion list removed");
});

test("Valid DOM element", function(){
  var domTarget = document.querySelector(this.target);
  ok(new Autocomplete(domTarget, [], globalOpts), "Can also directly pass the dom node");
  domTarget.dispatchEvent(createEvent('removeAutocomplete'));
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
    // this.target = document.createElement('input');
    // this.target.type = 'text';
    // document.querySelector('body').appendChild(target);
    simulateInput(this.target, '');
    this.autocomplete = new Autocomplete(target, data, globalOpts);
  },

  teardown: function() {
    this.target.dispatchEvent(createEvent('removeAutocomplete'));
  }
});

test("No search query", function() {
  var allData = this.autocomplete._getFilteredData();
  equal(allData.length, 0, "No data match an empty query");
});

test("With some user input", function() {
  simulateInput(this.target, "no data for this one");
  equal(this.autocomplete._getFilteredData().length, 0, "No data for the wrong input");

  simulateInput(this.target, "Bul");
  deepEqual(this.autocomplete._getFilteredData(), ["Bulbasaur"], "Match result");

  simulateInput(this.target, "basa");
  deepEqual(this.autocomplete._getFilteredData(), ["Bulbasaur"], "Match anywhere in the data");

  simulateInput(this.target, "a");
  deepEqual(this.autocomplete._getFilteredData(), ["Bulbasaur", "Pikachu"], "Returns all matching data");
});

module("Custom accessor function for filteredData");

test("With a custom accessor function", function() {
  data = [ {name: "Bulbasaur"}, {name: "Mew"} ];
  globalOpts.value = function(d) { return d.name; };
  var target = document.querySelector('input#target');
  var autocomplete = new Autocomplete(target, data, globalOpts);

  simulateInput(target, "bul");
  deepEqual(autocomplete._getFilteredData(), [{name: "Bulbasaur"}], "Can specify custom accessor for complex data.");

  delete globalOpts.value;
  target.dispatchEvent(createEvent('removeAutocomplete'));
});

module("List of suggestions", {
  setup: function() {
    var data = [
      "Bulbasaur1", "Bulbasaur2", "Bulbasaur3", "Bulbasaur4", "Bulbasaur5", "Bulbasaur6", "Mew", "Pikachu"
    ];
    this.data = data;
    this.target = document.querySelector('input#target');

    simulateInput(this.target, '');
    this.autocomplete = new Autocomplete(this.target, data, globalOpts);
    window.autocomplete = this.autocomplete;
  },

  teardown: function() {
    this.target.dispatchEvent(createEvent('removeAutocomplete'));
  }
});

test("Display list of suggestions", function() {
  simulateInput(this.target, "bulba");
  var children = document.querySelector('ul.suggestion').children;
  equal(children.length, 6, "only show 5 suggestion by default");
});

test("Display only relevant suggestions", function() {
  simulateInput(this.target, "bulbasaur1");
  equal(document.querySelector('ul.suggestion').children.length, 1,
    "Only one suggestion");
});

test("Click on suggestion copy input", function() {
  simulateInput(this.target, "bulb");
  var item = document.querySelectorAll('ul.suggestion li')[0];
  item.dispatchEvent(createEvent('click'));
  equal(this.target.value, "Bulbasaur1", "Clicking on suggestion copy its content to the input");
});

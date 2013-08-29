
// change this if you want more logs on the automated tests
var globalOpts = {verbose: false};

// polyfill for new Event() in phantomJS, see
// https://github.com/ariya/phantomjs/issues/11289
var createEvent = function(name) {
  var evt = document.createEvent('CustomEvent'); // MUST be 'CustomEvent'
  evt.initCustomEvent(name, true, false, null);
  return evt;
};

// form.submit() doesn't trigger the 'submit' handlers, and so bypass any
// validation. So to test that, I manually trigger the event 'submit'.
// This is a hack and a limitation of my approach. I don't know if there
// is any workaround for this.
var submitForm = function(form) {
  form.dispatchEvent(createEvent('submit'));
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
    simulateInput(this.target, '');
    this.autocomplete = new Autocomplete(target, data, globalOpts);
  },

  teardown: function() {
    this.target.dispatchEvent(createEvent('removeAutocomplete'));
  }
});

test("No search query", function() {
  var allData = this.autocomplete.getFilteredData();
  equal(allData.length, 0, "No data match an empty query");
});

test("With some user input", function() {
  simulateInput(this.target, "no data for this one");
  equal(this.autocomplete.getFilteredData().length, 0, "No data for the wrong input");

  simulateInput(this.target, "Bul");
  deepEqual(this.autocomplete.getFilteredData(), ["Bulbasaur"], "Match result");

  simulateInput(this.target, "basa");
  deepEqual(this.autocomplete.getFilteredData(), ["Bulbasaur"], "Match anywhere in the data");

  simulateInput(this.target, "a");
  deepEqual(this.autocomplete.getFilteredData(), ["Bulbasaur", "Pikachu"], "Returns all matching data");
});

module("Custom accessor function for filteredData");

test("With a custom accessor function", function() {
  data = [ {name: "Bulbasaur"}, {name: "Mew"} ];
  var opts = _.extend({}, globalOpts, {value: function(d) { return d.name; }});
  var target = document.querySelector('input#target');
  var autocomplete = new Autocomplete(target, data, opts);

  simulateInput(target, "bul");
  deepEqual(autocomplete.getFilteredData(), [{name: "Bulbasaur"}], "Can specify custom accessor for complex data.");

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
  equal(children.length, 6, "only show 5 suggestion by default (plus the 'more' item)");

  simulateInput(this.target, "mew");
  children = document.querySelector('ul.suggestion').children;
  equal(children.length, 1, "The 'more' item is not shown if filtered result below display limit");
});

test("Custom number of displayed suggestion", function() {
  var opts = _.extend({}, globalOpts, {displayLimit: 2});
  new Autocomplete(this.target, this.data, opts);

  simulateInput(this.target, "bulba");
  var children = document.querySelector('ul.suggestion').children;
  equal(children.length, 3, "Can override the number of displayed suggestions");
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


module("Validation", {
  setup: function() {
    var data = [
      "Bulbasaur1", "Bulbasaur2", "Bulbasaur3", "Bulbasaur4", "Bulbasaur5", "Bulbasaur6", "Mew", "Pikachu"
    ];
    this.data = data;
    this.target = document.querySelector('input#target');
    simulateInput(this.target, '');
    this.form = document.querySelector('form');
  },

  teardown: function() {
    this.target.dispatchEvent(createEvent('removeAutocomplete'));
  }
});

test("Validation set to true", function() {
  var opts = _.extend({}, globalOpts, {validation: true});
  new Autocomplete(this.target, this.data, opts);
  submitForm(this.form);
  ok(document.querySelector('.autocomplete-error:not(.hide)'), "Error message is displayed");
});

test("Validation with a selector", function() {
  var opts = _.extend({}, globalOpts, {validation: 'form#targetForm'});
  new Autocomplete(this.target, this.data, opts);
  submitForm(this.form);
  ok(document.querySelector('.autocomplete-error:not(.hide)'), "Error message is displayed");
});

test("Validation with a dom node", function(){
  var targetForm = document.querySelector('form#targetForm');
  var opts = _.extend({}, globalOpts, {validation: targetForm});
  new Autocomplete(this.target, this.data, opts);
  submitForm(this.form);
  ok(document.querySelector('.autocomplete-error:not(.hide)'), "Error message is displayed");
});

test("Custom validation trigger", function() {
  var targetValidation = document.querySelector('div#submitTrigger');
  var opts = _.extend({}, globalOpts, {
    validation: targetValidation,
    validateTrigger: 'click'
  });
  new Autocomplete(this.target, this.data, opts);
  targetValidation.dispatchEvent(createEvent('click'));
  ok(document.querySelector('.autocomplete-error:not(.hide)'), "Error message is displayed");
});



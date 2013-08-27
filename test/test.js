test("hello", function() {
  ok(1===1, "passed !");
});

test("Creation", function() {
  throws(function(){new Autocomplete();}, "Cannot create the widget without a target");
});

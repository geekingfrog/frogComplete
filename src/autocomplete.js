;(function (exports) {
  "use strict";

  console.log("exports: ", exports);
  exports.init = function(){};

  exports.Autocomplete = function(target, opts) {
    // if(!exports.document){
    //   throw new Error("fooo");
    // } else {
    //   console.log("ok document");
    // }

    console.log(target);


    if(target === void(0)) {
      throw new Error("You must pass an input element at creation. Eg: new Autocomplete(document.querySelector('input#target'))");
    }

    opts = opts || {};
    data = opts.data;

    if(data === void(0) || data === null) {
      throw new Error("No data passed. Try something like: new Autocomplete(target, {data: myData})");
    }
  };


})(this);


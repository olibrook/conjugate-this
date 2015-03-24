define([], function(){
  'use strict';

  var ctUtils = {};

  ctUtils.zip = function(arr1, arr2) {
    if(arr1.length !== arr2.length) {
      throw new Error('Zip not supported for arrays of unequal length.');
    } else {
      return arr1.map(function(val, index){
        return [val, arr2[index]];
      });
    }
  };

  return ctUtils;
});


"use strict";
exports.__esModule = true;
function checkType(params, type) {
    return Object.prototype.toString.call(params) === "[object " + type + "]";
}
exports.checkType = checkType;
;
function getFilterArr(arr, type) {
    if (Array.isArray(arr)) {
        return arr.filter(function (item) { return checkType(item, type); });
    }
    else {
        return [];
    }
}
exports.getFilterArr = getFilterArr;
;
function changeBool(item) {
    if (Array.isArray(item)) {
        return item.every(function (str) { return str !== undefined; });
    }
    else {
        return item !== undefined;
    }
}
exports.changeBool = changeBool;

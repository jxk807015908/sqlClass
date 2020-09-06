function checkType(params, type) {
        return Object.prototype.toString.call(params) === `[object ${type}]`;
    };
function getFilterArr(arr, type) {
    if (Array.isArray(arr)) {
        return arr.filter(item=>checkType(item, type));
    } else {
        return [];
    }
};
function changeBool(item) {
    if (Array.isArray(item)) {
        return item.every(str=>str !== undefined);
    } else {
        return item !== undefined;
    }
}
export {
    checkType,
    getFilterArr,
    changeBool
};
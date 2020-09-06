"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var utils_1 = require("./utils");
var mysql = require("mysql");
// const mysql = require('mysql');
// function keyChange(obj = {}, map = {}) {
//     return Object.keys(obj).reduce((o, key)=>{
//         o[map[key] || key] = mysql.escape(obj[key]);
//         return o;
//     }, {});
// };
//
// function handleEqual(params, keyMap) {
//     params = keyChange(params);
//     let tableKey=[];
//     Object.keys(params).forEach(key=>{
//         if(params[key]!==null&&keyMap[key]!==undefined){
//             tableKey.push(`${keyMap[key]}=${params[key]}`)
//         }
//     });
//     return tableKey;
// }
//
var Judge = /** @class */ (function () {
    function Judge(params) {
        var _a = params || {}, _b = _a.key, key = _b === void 0 ? undefined : _b, _c = _a.judge, judge = _c === void 0 ? '=' : _c, _d = _a.value, value = _d === void 0 ? undefined : _d, _e = _a.isDoubleKey, isDoubleKey = _e === void 0 ? false : _e;
        this.key = key;
        this.judge = judge;
        this.value = value;
        this.isDoubleKey = isDoubleKey;
    }
    ;
    Judge.prototype.translate = function (bool) {
        if (utils_1.changeBool([this.key, this.judge, this.value])) {
            return this.key + " " + this.judge + " " + (this.isDoubleKey ? this.value : mysql.escape(this.value));
        }
        return '';
    };
    return Judge;
}());
exports.Judge = Judge;
var JudgeGroup = /** @class */ (function () {
    function JudgeGroup(params) {
        var _a = params || {}, _b = _a.judge1, judge1 = _b === void 0 ? undefined : _b, _c = _a.judge, judge = _c === void 0 ? 'and' : _c, _d = _a.judge2, judge2 = _d === void 0 ? undefined : _d;
        if (utils_1.changeBool([judge1, judge2])) {
            this.judge1 = this.handleJudge(judge1);
            this.judge = judge;
            this.judge2 = this.handleJudge(judge2);
        }
    }
    ;
    JudgeGroup.prototype.handleJudge = function (params) {
        if (this.checkType(params, 'Object')) {
            var judge1 = params.judge1, judge2 = params.judge2, key = params.key, value = params.value;
            if (utils_1.changeBool([judge1, judge2])) {
                return new JudgeGroup(params);
            }
            else if (utils_1.changeBool([key, value])) {
                return new Judge(params);
            }
        }
    };
    ;
    JudgeGroup.prototype.checkType = function (params, type) {
        return Object.prototype.toString.call(params) === "[object " + type + "]";
    };
    ;
    JudgeGroup.prototype.translate = function (bool) {
        if (utils_1.changeBool([this.judge1, this.judge2, this.judge])) {
            return "" + (bool ? '(' : '') + this.judge1.translate(true) + " " + this.judge + " " + this.judge2.translate(true) + (bool ? ')' : '');
        }
        else if (utils_1.changeBool([this.judge1])) {
            return this.judge1.translate(true);
        }
        else if (utils_1.changeBool([this.judge2])) {
            return this.judge2.translate(true);
        }
        return '';
    };
    return JudgeGroup;
}());
var Where = /** @class */ (function () {
    function Where(params) {
        this.judge = this.handleJudge(params);
    }
    ;
    Where.prototype.handleJudge = function (params) {
        if (this.checkType(params, 'Object')) {
            var judge1 = params.judge1, judge2 = params.judge2, key = params.key, value = params.value;
            if (utils_1.changeBool([judge1, judge2])) {
                return new JudgeGroup(params);
            }
            else if (utils_1.changeBool([key, value])) {
                return new Judge(params);
            }
        }
        // return params;
    };
    ;
    Where.prototype.checkType = function (params, type) {
        return Object.prototype.toString.call(params) === "[object " + type + "]";
    };
    ;
    Where.prototype.translate = function () {
        if (this.judge) {
            return "WHERE " + this.judge.translate();
        }
        return '';
    };
    return Where;
}());
var OrderPart = /** @class */ (function () {
    function OrderPart(params) {
        var _a = params || {}, _b = _a.key, key = _b === void 0 ? undefined : _b, _c = _a.isASC, isASC = _c === void 0 ? true : _c;
        this.key = key;
        this.isASC = isASC;
    }
    OrderPart.prototype.translate = function () {
        if (this.key) {
            return this.key + " " + (this.isASC ? 'ASC' : 'DESC');
        }
        return '';
    };
    return OrderPart;
}());
var Order = /** @class */ (function () {
    function Order(list) {
        this.orderPartList = this.handleJudge(list);
    }
    Order.prototype.handleJudge = function (list) {
        if (utils_1.checkType(list, 'Array')) {
            return list.reduce(function (arr, obj) {
                if (utils_1.checkType(obj, 'Object')) {
                    arr.push(new OrderPart(obj));
                }
                else if (utils_1.checkType(obj, 'String')) {
                    arr.push(new OrderPart({ key: obj }));
                }
                else if (utils_1.checkType(obj, 'OrderPart')) {
                    arr.push(obj);
                }
                return arr;
            }, []);
        }
        return [];
    };
    ;
    Order.prototype.handleOrderPartList = function () {
        if (this.orderPartList) {
            return "" + this.orderPartList.map(function (orderPart) { return orderPart.translate(); }).join(',');
        }
        return '';
    };
    Order.prototype.translate = function () {
        if (this.orderPartList && this.orderPartList.length) {
            return "ORDER BY " + this.handleOrderPartList();
        }
        return '';
    };
    return Order;
}());
var JoinPart = /** @class */ (function () {
    function JoinPart(params) {
        var _a = params || {}, _b = _a.type, type = _b === void 0 ? '' : _b, _c = _a.judge, judge = _c === void 0 ? undefined : _c, _d = _a.table, table = _d === void 0 ? undefined : _d;
        this.type = type;
        this.table = table;
        this.judge = this.handleJudge(judge);
    }
    JoinPart.prototype.handleJudge = function (params) {
        if (this.checkType(params, 'Object')) {
            var judge1 = params.judge1, judge2 = params.judge2, key = params.key, value = params.value;
            if (utils_1.changeBool([judge1, judge2])) {
                return new JudgeGroup(params);
            }
            else if (utils_1.changeBool([key, value])) {
                return new Judge(params);
            }
        }
    };
    ;
    JoinPart.prototype.checkType = function (params, type) {
        return Object.prototype.toString.call(params) === "[object " + type + "]";
    };
    ;
    JoinPart.prototype.translate = function () {
        if (this.type && this.table && this.judge) {
            return this.type + " JOIN " + this.table + " ON " + this.judge.translate();
        }
        return '';
    };
    return JoinPart;
}());
var Join = /** @class */ (function () {
    function Join(params) {
        if (utils_1.checkType(params, 'Object')) {
            this.list = [new JoinPart(params)];
        }
        else if (Array.isArray(params)) {
            this.list = params.map(function (obj) { return new JoinPart(obj); });
        }
    }
    Join.prototype.translate = function () {
        if (this.list) {
            return "" + this.list.map(function (joinPart) { return joinPart.translate(); }).join(' ');
        }
        return '';
    };
    return Join;
}());
//
var Table = /** @class */ (function () {
    function Table(params) {
        if (utils_1.checkType(params, 'String')) {
            this.list = [params];
        }
        else if (utils_1.checkType(params, 'Array')) {
            this.list = params.reduce(function (arr, str) {
                if (utils_1.checkType(str, 'String')) {
                    arr.push(str);
                }
                return arr;
            }, []);
        }
        else {
            this.list = [];
        }
    }
    ;
    Table.prototype.translate = function () {
        return "" + this.list.join(',');
    };
    ;
    return Table;
}());
var Field = /** @class */ (function () {
    function Field(params, table) {
        var tableList = table.list;
        var list = [];
        if (utils_1.checkType(params, 'Object')) {
            if (tableList.length > 1) {
                tableList.forEach(function (tableName) {
                    list = list.concat(utils_1.getFilterArr(params[tableName], 'String').map(function (str) { return tableName + "." + str; }));
                });
            }
            else {
                tableList.forEach(function (tableName) {
                    list = list.concat(utils_1.getFilterArr(params[tableName], 'String'));
                });
            }
        }
        else if (Array.isArray(params) && tableList.length === 1) {
            list = list.concat(utils_1.getFilterArr(params, 'String'));
        }
        this.list = list.length ? list : ['*'];
    }
    ;
    Field.prototype.translate = function () {
        return "" + this.list.join(',');
    };
    ;
    return Field;
}());
var Limit = /** @class */ (function () {
    function Limit(params) {
        var start = params.start, num = params.num;
        this.start = start;
        this.num = num;
    }
    ;
    Limit.prototype.translate = function () {
        if (this.start !== undefined && this.num !== undefined) {
            return "limit " + this.start + ", " + this.num;
        }
        else {
            return '';
        }
    };
    ;
    return Limit;
}());
var GroupBy = /** @class */ (function () {
    function GroupBy(list) {
        if (utils_1.checkType(list, 'String')) {
            this.list = [list];
        }
        else if (Array.isArray(list)) {
            this.list = list;
        }
    }
    ;
    GroupBy.prototype.translate = function () {
        if (this.list) {
            return "GROUP BY " + this.list.join(',');
        }
        else {
            return '';
        }
    };
    ;
    return GroupBy;
}());
var Params = /** @class */ (function () {
    function Params(params) {
        this.distinct = false;
        var _a = params || {}, _b = _a.table, table = _b === void 0 ? undefined : _b, _c = _a.distinct, distinct = _c === void 0 ? false : _c, _d = _a.field, field = _d === void 0 ? ['*'] : _d, _e = _a.where, where = _e === void 0 ? undefined : _e, _f = _a.order, order = _f === void 0 ? undefined : _f, _g = _a.limit, limit = _g === void 0 ? {} : _g, _h = _a.join, join = _h === void 0 ? undefined : _h, _j = _a.groupBy, groupBy = _j === void 0 ? undefined : _j;
        this.table = new Table(table);
        this.distinct = distinct;
        this.field = new Field(field, this.table);
        this.where = new Where(where);
        this.join = new Join(join);
        this.groupBy = new GroupBy(groupBy);
        this.order = new Order(order);
        this.limit = new Limit(limit);
    }
    return Params;
}());
var SelectSql = /** @class */ (function (_super) {
    __extends(SelectSql, _super);
    function SelectSql(params) {
        return _super.call(this, params) || this;
    }
    ;
    SelectSql.prototype.translate = function () {
        return "SELECT" + (this.distinct ? ' DISTINCT' : '') + " " + this.field.translate() + " FROM " + this.table.translate() + " " + this.join.translate() + " " + this.where.translate() + " " + this.groupBy.translate() + " " + this.order.translate() + " " + this.limit.translate();
    };
    ;
    return SelectSql;
}(Params));
exports.SelectSql = SelectSql;
var InsertSql = /** @class */ (function (_super) {
    __extends(InsertSql, _super);
    function InsertSql(config) {
        var _this = _super.call(this, config) || this;
        var _a = (config || {}).data, data = _a === void 0 ? {} : _a;
        _this.data = data;
        var columns = [];
        var values = [];
        Object.keys(data).forEach(function (key) {
            columns.push(key);
            values.push(mysql.escape(data[key]));
        });
        _this.columns = columns;
        _this.values = values;
        return _this;
    }
    ;
    InsertSql.prototype.translate = function () {
        return "INSERT INTO " + this.table.translate() + "(" + this.columns.join(',') + ") VALUES (" + this.values.join(',') + ")";
    };
    ;
    return InsertSql;
}(Params));
exports.InsertSql = InsertSql;
var UpdateSql = /** @class */ (function (_super) {
    __extends(UpdateSql, _super);
    function UpdateSql(params) {
        var _this = _super.call(this, params) || this;
        var _a = (params || {}).data, data = _a === void 0 ? {} : _a;
        _this.data = Object.keys(data).reduce(function (arr, key) {
            arr.push(new Judge({ key: key, value: data[key] === undefined ? null : data[key] }));
            return arr;
        }, []);
        return _this;
    }
    ;
    UpdateSql.prototype.translate = function () {
        return "UPDATE " + this.table.translate() + " SET " + this.data.map(function (judge) { return judge.translate(); }).filter(function (str) { return str !== '' && str !== undefined && str !== null; }).join(',') + "  " + this.where.translate();
    };
    ;
    return UpdateSql;
}(Params));
exports.UpdateSql = UpdateSql;
var DeleteSql = /** @class */ (function (_super) {
    __extends(DeleteSql, _super);
    function DeleteSql(params) {
        var _this = _super.call(this, params) || this;
        var _a = (params || {}).date, date = _a === void 0 ? [] : _a;
        _this.date = date.map(function (obj) { return new Judge(obj); });
        return _this;
    }
    ;
    DeleteSql.prototype.translate = function () {
        return "DELETE FROM  " + this.table.translate() + " " + this.where.translate();
    };
    ;
    return DeleteSql;
}(Params));
exports.DeleteSql = DeleteSql;
var SqlCreate = /** @class */ (function () {
    function SqlCreate(config) {
        var _a = config.type, type = _a === void 0 ? 'select' : _a;
        this.type = type;
        switch (type) {
            case 'insert':
                this.sql = new InsertSql(config);
                break;
            case 'update':
                this.sql = new UpdateSql(config);
                break;
            case 'delete':
                this.sql = new DeleteSql(config);
                break;
            default:
                this.sql = new SelectSql(config);
        }
    }
    SqlCreate.prototype.translate = function () {
        return this.sql.translate();
    };
    return SqlCreate;
}());
exports.SqlCreate = SqlCreate;
// let p1 = new Judge({key: 'aaa', value: '1'});
// let p2 = new Judge({key: 'bbb', value: '2', judge: '>='});
// let p3 = new Judge({key: 'ccc', value: '3', judge: '!='});
// let g1 = new JudgeGroup({judge1: p2, judge2: p3, judge: 'or'});
// let g2 = new JudgeGroup({judge1: p1, judge2: g1});
// console.log(g2.translate());
// let a = {
//     judge1: {
//         key: 'aaa',
//         value: '1'
//     },
//     judge2: {
//         judge1: {
//             key: 'bbb',
//             value: 2,
//             judge: '>='
//         },
//         judge2: {
//             key: 'ccc',
//             value: '3',
//             judge: '!='
//         },
//         judge: 'or'
//     }
// };
// console.log(new Where(a).translate());
// let b = ['aaa', 'bbb', 'ccc'];
// let c = [
//     {
//         key: 'aaa',
//         isASC: false
//     },
//     'bbb',
//     'ccc'
// ];
// console.log(new Order(b).translate());
// console.log(new Order(c).translate());
// let d = {
//     table: ['table1', 'table2'],
//     field: {
//         table1: ['a', 'b'],
//         table2: ['c', 'd'],
//     }
// };
// let e = {
//     table: 'table1',
//     // field: {
//     //     table1: ['a', 'b'],
//     //     table2: ['c', 'd'],
//     // },
//     field: ['a', 'b'],
//     order: ['b'],
//     where: a
// };
// console.log(new SelectSql(d).translate());
// console.log(new SelectSql(e).translate());
// let params = {
//     aaa: '111',
//     bbb: '222',
//     ccc: '333'
// };
// let f = {
//     table: 'table1',
//     // field: {
//     //     table1: ['a', 'b'],
//     //     table2: ['c', 'd'],
//     // },
//     params: params,
//     // field: ['a', 'b'],
//     // order: ['b'],
//     // where: a
// };
// console.log(new InsertSql(f).translate());
// let g = {
//     table: 'table1',
//     // field: {
//     //     table1: ['a', 'b'],
//     //     table2: ['c', 'd'],
//     // },
//     data: params,
//     // field: ['a', 'b'],
//     // order: ['b'],
//     where: a
// }
// console.log(new UpdateSql(g).translate());
// let h = {
//     table: 'table1',
//     where: a
// };
// console.log(new DeleteSql(h).translate());
// console.log(new SqlCreate(h).translate());
// console.log(mysql.escape(`' or 1=1 #`));

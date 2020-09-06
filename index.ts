import {checkType, getFilterArr, changeBool} from './utils';
import mysql = require('mysql');
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
class Judge {
    public key: string | undefined;
    public judge: string | undefined;
    public value: string | undefined;
    public isDoubleKey: boolean;
    constructor(params) {
        let { key = undefined, judge = '=', value = undefined, isDoubleKey = false } = params || {};
        this.key = key;
        this.judge = judge;
        this.value = value;
        this.isDoubleKey = isDoubleKey;
    };
    public translate(bool?) {
        if (changeBool([this.key, this.judge, this.value])) {
            return `${this.key} ${this.judge} ${this.isDoubleKey ? this.value : mysql.escape(this.value)}`;
        }
        return '';
    }
}
class JudgeGroup {
    public judge1:Judge | JudgeGroup | undefined;
    public judge: string | undefined;
    public judge2:Judge | JudgeGroup | undefined;
    constructor(params) {
        let { judge1 = undefined, judge = 'and', judge2 = undefined } = params || {};
        if (changeBool([judge1, judge2])) {
            this.judge1 = this.handleJudge(judge1);
            this.judge = judge;
            this.judge2 = this.handleJudge(judge2);
        }
    };
    public handleJudge(params) {
        if (this.checkType(params, 'Object')) {
            let { judge1, judge2, key, value } = params;
            if (changeBool([judge1, judge2])) {
                return new JudgeGroup(params);
            } else if (changeBool([key, value])) {
                return new Judge(params);
            }
        }
    };
    public checkType(params, type) {
        return Object.prototype.toString.call(params) === `[object ${type}]`;
    };
    public translate(bool?) {
        if (changeBool([this.judge1, this.judge2, this.judge])) {
            return `${bool ? '(' : ''}${this.judge1.translate(true)} ${this.judge} ${this.judge2.translate(true)}${bool ? ')' : ''}`;
        } else if (changeBool([this.judge1])) {
            return this.judge1.translate(true);
        } else if (changeBool([this.judge2])) {
            return this.judge2.translate(true);
        }
        return '';
    }
}
class Where {
    public judge:Judge | JudgeGroup | undefined;
    constructor(params) {
        this.judge = this.handleJudge(params);
    };
    public handleJudge(params) {
        if (this.checkType(params, 'Object')) {
            let { judge1, judge2, key, value } = params;
            if (changeBool([judge1, judge2])) {
                return new JudgeGroup(params);
            } else if (changeBool([key, value])) {
                return new Judge(params);
            }
        }
        // return params;
    };
    public checkType(params, type) {
        return Object.prototype.toString.call(params) === `[object ${type}]`;
    };
    public translate() {
        if (this.judge) {
            return `WHERE ${this.judge.translate()}`;
        }
        return '';
    }
}


class OrderPart {
    public key: string | undefined;
    public isASC: boolean;
    constructor(params) {
        let {key = undefined, isASC = true} = params || {};
        this.key = key;
        this.isASC = isASC;
    }
    public translate() {
        if (this.key) {
            return `${this.key} ${this.isASC ? 'ASC' : 'DESC'}`;
        }
        return '';
    }
}
class Order{
    public orderPartList: Array<OrderPart> | undefined;
    constructor(list) {
        this.orderPartList = this.handleJudge(list);
    }
    public handleJudge(list) {
        if (checkType(list, 'Array')) {
            return list.reduce((arr, obj)=>{
                if (checkType(obj, 'Object')) {
                    arr.push(new OrderPart(obj));
                } else if (checkType(obj, 'String')) {
                    arr.push(new OrderPart({key: obj}));
                } else if (checkType(obj, 'OrderPart')) {
                    arr.push(obj);
                }
                return arr;
            }, []);
        }
        return [];
    };
    public handleOrderPartList() {
        if (this.orderPartList) {
            return `${this.orderPartList.map(orderPart=>orderPart.translate()).join(',')}`;
        }
        return '';
    }
    public translate() {
        if (this.orderPartList && this.orderPartList.length) {
            return `ORDER BY ${this.handleOrderPartList()}`;
        }
        return '';
    }
}

class JoinPart{
    public type: string | undefined;
    public table: string | undefined;
    public judge:Judge | JudgeGroup | undefined;
    constructor(params) {
        let { type = '', judge = undefined, table = undefined } = params || {};
        this.type = type;
        this.table = table;
        this.judge = this.handleJudge(judge);
    }
    public handleJudge(params) {
        if (this.checkType(params, 'Object')) {
            let { judge1, judge2, key, value } = params;
            if (changeBool([judge1, judge2])) {
                return new JudgeGroup(params);
            } else if (changeBool([key, value])) {
                return new Judge(params);
            }
        }
    };
    public checkType(params, type) {
        return Object.prototype.toString.call(params) === `[object ${type}]`;
    };
    public translate() {
        if (this.type && this.table && this.judge) {
            return `${this.type} JOIN ${this.table} ON ${this.judge.translate()}`;
        }
        return '';
    }
}

class Join{
    public list: Array<JoinPart> | undefined;
    constructor(params) {
        if (checkType(params, 'Object')) {
            this.list = [new JoinPart(params)];
        } else if (Array.isArray(params)) {
            this.list = params.map(obj=>new JoinPart(obj));
        }
    }
    public translate() {
        if (this.list) {
            return `${this.list.map(joinPart=>joinPart.translate()).join(' ')}`;
        }
        return '';
    }
}
//
class Table {
    public list: Array<string>;
    constructor(params) {
        if (checkType(params, 'String')) {
            this.list = [params];
        } else if (checkType(params, 'Array')) {
            this.list = params.reduce((arr, str)=>{
                if (checkType(str, 'String')) {
                    arr.push(str);
                }
                return arr;
            }, []);
        } else {
            this.list = [];
        }
    };
    public translate() {
        return `${this.list.join(',')}`;
    };
}
class Field {
    public list: Array<string>;
    constructor(params, table) {
        let tableList = table.list;
        let list = [];
        if (checkType(params, 'Object')) {
            if (tableList.length > 1) {
                tableList.forEach(tableName=>{
                    list = list.concat(getFilterArr(params[tableName], 'String').map(str=>`${tableName}.${str}`));
                });
            } else {
                tableList.forEach(tableName=>{
                    list = list.concat(getFilterArr(params[tableName], 'String'));
                });
            }
        } else if (Array.isArray(params) && tableList.length === 1) {
            list = list.concat(getFilterArr(params, 'String'));
        }
        this.list = list.length ? list : ['*'];
    };
    public translate() {
        return `${this.list.join(',')}`;
    };
}

class Limit {
    public start: number | undefined;
    public num: number | undefined;
    constructor(params) {
        let {start, num} = params;
        this.start = start;
        this.num = num;
    };
    public translate() {
        if (this.start !== undefined && this.num !== undefined) {
            return `limit ${this.start}, ${this.num}`;
        } else {
            return '';
        }
    };
}

class GroupBy {
    public list: Array<string> | undefined;
    constructor(list) {
        if (checkType(list, 'String')) {
            this.list = [list];
        } else if (Array.isArray(list)) {
            this.list = list;
        }
    };
    public translate() {
        if (this.list) {
            return `GROUP BY ${this.list.join(',')}`;
        } else {
            return '';
        }
    };
}

class Params {
    public table: Table;
    public distinct: boolean = false;
    public field: Field;
    public where: Where | undefined;
    public join: Join | undefined;
    public groupBy: GroupBy | undefined;
    public order: Order | undefined;
    public limit: Limit | undefined;
    constructor(params) {
        let { table = undefined, distinct = false, field = ['*'], where = undefined, order = undefined, limit = {}, join = undefined, groupBy = undefined } = params || {};
        this.table = new Table(table);
        this.distinct = distinct;
        this.field = new Field(field, this.table);
        this.where = new Where(where);
        this.join = new Join(join);
        this.groupBy = new GroupBy(groupBy);
        this.order = new Order(order);
        this.limit = new Limit(limit);
    }
}

class SelectSql extends Params{
    constructor(params) {
        super(params);
    };
    public translate() {
        return `SELECT${this.distinct ? ' DISTINCT' : ''} ${this.field.translate()} FROM ${this.table.translate()} ${this.join.translate()} ${this.where.translate()} ${this.groupBy.translate()} ${this.order.translate()} ${this.limit.translate()}`;
    };
}
class InsertSql extends Params{
    public columns: Array<string>;
    public values: Array<any>;
    public data: object;
    constructor(config) {
        super(config);
        let { data = {} } = config || {};
        this.data = data;
        let columns = [];
        let values = [];
        Object.keys(data).forEach(key=>{
            columns.push(key);
            values.push(mysql.escape(data[key]));
        });
        this.columns = columns;
        this.values = values;
    };
    public translate() {
        return `INSERT INTO ${this.table.translate()}(${this.columns.join(',')}) VALUES (${this.values.join(',')})`;
    };
}
class UpdateSql extends Params{
    public data: Array<Judge>;
    constructor(params) {
        super(params);
        let { data = {} } = params || {};
        this.data = Object.keys(data).reduce((arr, key)=>{
            arr.push(new Judge({key, value: data[key] === undefined ? null : data[key]}));
            return arr;
        }, []);
    };
    public translate() {
        return `UPDATE ${this.table.translate()} SET ${this.data.map(judge=>judge.translate()).filter(str=>str !== '' &&str !== undefined &&str !== null).join(',')}  ${this.where.translate()}`;
    };
}
class DeleteSql extends Params{
    public date: Array<Judge>;
    constructor(params) {
        super(params);
        let { date = [] } = params || {};
        this.date = date.map(obj=>new Judge(obj));
    };
    public translate() {
        return `DELETE FROM  ${this.table.translate()} ${this.where.translate()}`;
    };
}

class SqlCreate {
    public type: string;
    public sql: SelectSql | UpdateSql | InsertSql | DeleteSql;
    constructor(config) {
        let { type = 'select' } = config;
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
    public translate() {
        return this.sql.translate();
    }
}
export {
    Judge,
    SelectSql,
    InsertSql,
    UpdateSql,
    DeleteSql,
    SqlCreate
};
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

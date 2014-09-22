'use strict';

describe('angular', function() {

  describe("copy", function() {
    it("should return same object", function () {
      var obj = {};
      var arr = [];
      expect(copy({}, obj)).toBe(obj);
      expect(copy([], arr)).toBe(arr);
    });

    it("should copy Date", function() {
      var date = new Date(123);
      expect(copy(date) instanceof Date).toBeTruthy();
      expect(copy(date).getTime()).toEqual(123);
      expect(copy(date) === date).toBeFalsy();
    });

    it("should copy RegExp", function() {
      var re = new RegExp(".*");
      expect(copy(re) instanceof RegExp).toBeTruthy();
      expect(copy(re).source).toBe(".*");
      expect(copy(re) === re).toBe(false);
    });

    it("should copy literal RegExp", function() {
      var re = /.*/;
      expect(copy(re) instanceof RegExp).toBeTruthy();
      expect(copy(re).source).toEqual(".*");
      expect(copy(re) === re).toBeFalsy();
    });

    it("should copy RegExp with flags", function() {
      var re = new RegExp('.*', 'gim');
      expect(copy(re).global).toBe(true);
      expect(copy(re).ignoreCase).toBe(true);
      expect(copy(re).multiline).toBe(true);
    });

    it("should copy RegExp with lastIndex", function() {
      var re = /a+b+/g;
      var str = 'ab aabb';
      expect(re.exec(str)[0]).toEqual('ab');
      expect(copy(re).exec(str)[0]).toEqual('aabb');
    });

    it("should deeply copy literal RegExp", function() {
      var objWithRegExp = {
        re: /.*/
      };
      expect(copy(objWithRegExp).re instanceof RegExp).toBeTruthy();
      expect(copy(objWithRegExp).re.source).toEqual(".*");
      expect(copy(objWithRegExp.re) === objWithRegExp.re).toBeFalsy();
    });

    it("should deeply copy an array into an existing array", function() {
      var src = [1, {name:"value"}];
      var dst = [{key:"v"}];
      expect(copy(src, dst)).toBe(dst);
      expect(dst).toEqual([1, {name:"value"}]);
      expect(dst[1]).toEqual({name:"value"});
      expect(dst[1]).not.toBe(src[1]);
    });

    it("should deeply copy an array into a new array", function() {
      var src = [1, {name:"value"}];
      var dst = copy(src);
      expect(src).toEqual([1, {name:"value"}]);
      expect(dst).toEqual(src);
      expect(dst).not.toBe(src);
      expect(dst[1]).not.toBe(src[1]);
    });

    it('should copy empty array', function() {
      var src = [];
      var dst = [{key: "v"}];
      expect(copy(src, dst)).toEqual([]);
      expect(dst).toEqual([]);
    });

    it("should deeply copy an object into an existing object", function() {
      var src = {a:{name:"value"}};
      var dst = {b:{key:"v"}};
      expect(copy(src, dst)).toBe(dst);
      expect(dst).toEqual({a:{name:"value"}});
      expect(dst.a).toEqual(src.a);
      expect(dst.a).not.toBe(src.a);
    });

    it("should deeply copy an object into a non-existing object", function() {
      var src = {a:{name:"value"}};
      var dst = copy(src, undefined);
      expect(src).toEqual({a:{name:"value"}});
      expect(dst).toEqual(src);
      expect(dst).not.toBe(src);
      expect(dst.a).toEqual(src.a);
      expect(dst.a).not.toBe(src.a);
    });

    it("should copy primitives", function() {
      expect(copy(null)).toEqual(null);
      expect(copy('')).toBe('');
      expect(copy('lala')).toBe('lala');
      expect(copy(123)).toEqual(123);
      expect(copy([{key:null}])).toEqual([{key:null}]);
    });

    it('should throw an exception if a Window is being copied', function() {
      expect(function() { copy(window); }).
          toThrow("Can't copy! Making copies of Window or Scope instances is not supported.");
    });

    it('should throw an exception when source and destination are equivalent', function() {
      var src, dst;
      src = dst = {key: 'value'};
      expect(function() { copy(src, dst); }).toThrow("Can't copy! Source and destination are identical.");
      src = dst = [2, 4];
      expect(function() { copy(src, dst); }).toThrow("Can't copy! Source and destination are identical.");
    });

    it('should handle circular references when circularRefs is turned on', function () {
      var a = {b: {a: null}, self: null, selfs: [null, null, [null]]};
      a.b.a = a;
      a.self = a;
      a.selfs = [a, a.b, [a]];

      var aCopy = copy(a, null);
      expect(aCopy).toEqual(a);

      expect(aCopy).not.toBe(a);
      expect(aCopy).toBe(aCopy.self);
      expect(aCopy.selfs[2]).not.toBe(a.selfs[2]);
    });

    it('should clear destination arrays correctly when source is non-array', function() {
      expect(copy(null, [1,2,3])).toEqual([]);
      expect(copy(undefined, [1,2,3])).toEqual([]);
      expect(copy({0: 1, 1: 2}, [1,2,3])).toEqual([1,2]);
    });
  });


  describe('forEach', function() {
    it('should iterate over *own* object properties', function() {
      function MyObj() {
        this.bar = 'barVal';
        this.baz = 'bazVal';
      }
      MyObj.prototype.foo = 'fooVal';

      var obj = new MyObj(),
          log = [];

      forEach(obj, function(value, key) { log.push(key + ':' + value); });

      expect(log).toEqual(['bar:barVal', 'baz:bazVal']);
    });


    it('should not break if obj is an array we override hasOwnProperty', function() {
      /* jshint -W001 */
      var obj = [];
      obj[0] = 1;
      obj[1] = 2;
      obj.hasOwnProperty = null;
      var log = [];
      forEach(obj, function(value, key) {
        log.push(key + ':' + value);
      });
      expect(log).toEqual(['0:1', '1:2']);
    });


    it('should handle HTMLCollection objects like arrays', function() {
      document.body.innerHTML = "<p>" +
                                  "<a name='x'>a</a>" +
                                  "<a name='y'>b</a>" +
                                  "<a name='x'>c</a>" +
                                "</p>";

      var htmlCollection = document.getElementsByName('x'),
          log = [];

      forEach(htmlCollection, function(value, key) { log.push(key + ':' + value.innerHTML); });
      expect(log).toEqual(['0:a', '1:c']);
    });

    if (document.querySelectorAll) {
      it('should handle the result of querySelectorAll in IE8 as it has no hasOwnProperty function', function() {
        document.body.innerHTML = "<p>" +
          "<a name='x'>a</a>" +
          "<a name='y'>b</a>" +
          "<a name='x'>c</a>" +
          "</p>";

        var htmlCollection = document.querySelectorAll('[name="x"]'),
          log = [];

        forEach(htmlCollection, function(value, key) { log.push(key + ':' + value.innerHTML); });
        expect(log).toEqual(['0:a', '1:c']);
      });
    }

    it('should handle arguments objects like arrays', function() {
      var args,
          log = [];

      (function(){ args = arguments; }('a', 'b', 'c'));

      forEach(args, function(value, key) { log.push(key + ':' + value); });
      expect(log).toEqual(['0:a', '1:b', '2:c']);
    });

    it('should handle string values like arrays', function() {
      var log = [];

      forEach('bar', function(value, key) { log.push(key + ':' + value); });
      expect(log).toEqual(['0:b', '1:a', '2:r']);
    });


    it('should handle objects with length property as objects', function() {
      var obj = {
        'foo' : 'bar',
        'length': 2
      },
      log = [];

      forEach(obj, function(value, key) { log.push(key + ':' + value); });
      expect(log).toEqual(['foo:bar', 'length:2']);
    });


    it('should handle objects of custom types with length property as objects', function() {
      function CustomType() {
        this.length = 2;
        this.foo = 'bar';
      }

      var obj = new CustomType(),
          log = [];

      forEach(obj, function(value, key) { log.push(key + ':' + value); });
      expect(log).toEqual(['length:2', 'foo:bar']);
    });
  });


  describe('isDate', function() {
    it('should return true for Date object', function() {
      expect(isDate(new Date())).toBe(true);
    });

    it('should return false for non Date objects', function() {
      expect(isDate([])).toBe(false);
      expect(isDate('')).toBe(false);
      expect(isDate(23)).toBe(false);
      expect(isDate({})).toBe(false);
    });
  });


  describe('isRegExp', function() {
    it('should return true for RegExp object', function() {
      expect(isRegExp(/^foobar$/)).toBe(true);
      expect(isRegExp(new RegExp('^foobar$/'))).toBe(true);
    });

    it('should return false for non RegExp objects', function() {
      expect(isRegExp([])).toBe(false);
      expect(isRegExp('')).toBe(false);
      expect(isRegExp(23)).toBe(false);
      expect(isRegExp({})).toBe(false);
      expect(isRegExp(new Date())).toBe(false);
    });
  });

});

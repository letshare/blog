# javascript 基础易考易错点

## 原型链和继承

```javascript
function Animate(name){
    this.name = name;
}

var a = new Animate('dog')
// a.__proto__
// Animate.prototype
```
### 考察点：
1. 实例的__proto__  === 构造函数的 prototype, prototype 默认是{constructor:Animate} 如果被赋值会被重置掉constructor
2. 实例属性的查找过程就是不断向上查找原型对象的 __proto__ ，形成一条链条，俗称原型链
3. instanceof 可以判断实例是否属于原型链的某构造函数
4. 创建原型的方法
简单来说：核心是将一个构造函数的prototype 指向原型对象，然后new 构造函数返回，这是对象的__proto__
    ```javascript
    function object(o){
        function F(){}
        F.prototype = o;
        return new F();
    }
    ```
5. new做了什么
等价于一下实现：1.创建空对象 2.__proto__ 指向构造函数的F.prototype 3.调用构造函数
    ```javascript
    var obj  = {};
    obj.__proto__ = F.prototype;
    F.call(obj);
    ```

### 总结：

易问点是描述原型链，可以用实例属性查找过程去阐述。
易错点是分不清__proto__和prototype，记住一个是用在对象上，一个是用在函数上。
另外一个难点是理解new过程。

### 参考
[https://juejin.im/post/58f94c9bb123db411953691b](https://juejin.im/post/58f94c9bb123db411953691b)
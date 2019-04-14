// 创建一个TemplateCompiler模板编译工具
class TemplateCompiler {
  // 构造函数
  // 1、视图线索
  // 2、全局vm对象
  constructor(el, vm) {
    // 缓存重要的属性
    this.el = this.isElementNode(el)?el:document.querySelector(el);
    this.vm = vm;

    // 判断视图存在
    if(this.el) {
      // 1、把模板内容放入内存（片段）
      var fragment = this.node2fragment(this.el);
      // debugger;
      // 2、解析模板
      this.compile(fragment);
      // 3、把内存的结果，返回到页面
      this.el.appendChild(fragment);
    }
      
  }

  //***********工具方法*************/
  // 判断是否是元素节点
  isElementNode(node) {
    return node.nodeType === 1; // 1、元素节点， 2、属性节点， 3、文本节点
  }
  // 判断是否是文本节点
  isTextNode(node) {
    return node.nodeType === 3; //
  }
  toArray(fakeArr) {
    return [].slice.call(fakeArr);  // 假数组转成真数组
  }
  isDirective(attrName) { // v-text
    // debugger;
    return attrName.indexOf('v-') >= 0;
  }
  //*******************************/

  //***********核心方法*************/
  // 把模板放入内存，等待解析
  node2fragment(node) {
    // 1、创建内存片段
    var fragment = document.createDocumentFragment(),child;
    // debugger;
    // 2、把模板内容丢到内存
    while(child = node.firstChild) {
      fragment.appendChild(child);
    };
    // 3、返回
    return fragment;
  }
  // 解析模板
  compile(parent) {
    // 1、获取子节点
    var childNode = parent.childNodes,
        compiler = this;
    // 2、遍历每一个节点
    this.toArray(childNode).forEach((node) => {
      // 3、判断节点类型
        if(compiler.isElementNode(node)){
          // 1) 属性节点（解析指令）
          compiler.compileElement(node);
        }else{ // 2) 文本节点 （解析指令）
          // 定义文本表达式验证规则
          var textReg = /\{\{(.+)\}\}/  // {{message}}
          var expr = node.textContent;
          // 按照规则验证内容
          if(textReg.test(expr)){
            expr = RegExp.$1;
            // 调用方法编译
            console.log('RegExp')
            console.log(expr)
            // alert('RegExp')
            compiler.compileText(node, expr);
            // debugger;
          }
        }
        
        // 2) 文本节点（解析指令）
    });
  }

  // 解析元素节点的指令的
  compileElement(node) {
    // 1、获取当前元素节点的所有属性
    var arrs = node.attributes,
        compiler = this;
        // debugger;
    // 2、遍历当前元素的所有属性
    this.toArray(arrs).forEach(attr => {
      var attrName = attr.name;
      // 3、判断属性是否是指令
      if(compiler.isDirective(attrName)) {
        // debugger;
        // 4、收集
          // 指令类型
          // var type = attrName.split('-')[1];
          var type = attrName.substr(2);
          // 指令的值就是表达式
          var expr = attr.value;
          // debugger;
        // 5、找帮手
        CompilerUtils[type](node, compiler.vm, expr)
      }

    })
    // debugger;
  }
  // 解析表达式的
  compileText(node, expr) {
    console.log('this.vm', this.vm.$data)
    // alert('compileText')
    CompilerUtils.text(node, this.vm, expr);
  }
}

// 帮手
CompilerUtils = {
  // 解析text指令
  text(node, vm, expr) {
    /* 第一次 */
    // 1. 找到更新规则对象的更新方法
    var updaterFn = this.updater['textUpdater'];
    // 2. 执行方法
    console.log('vm.$data[expr]: ', vm.$data[expr])
    updaterFn && updaterFn(node, vm.$data[expr]);
    // debugger;

    /* 第n+1次 */
    // 1. 需要使用订阅功能的节点
    // 2. 全局vm对象，用于获取数据
    // 3. 发布时需要做的事情
    new Watcher(vm, expr, (newValue) => {
      // 触发订阅时，按照之前的规则，对节点进行更新
      updaterFn && updaterFn(node, newValue);
    });
  },


  // 解析text指令
  model(node, vm, expr) {
    // 1. 找到更新规则对象的更新方法
    var updaterFn = this.updater['modelUpdater'];
    // 2. 执行方法
    updaterFn && updaterFn(node, vm.$data[expr]);

    // 对model指令也添加一个订阅者
    new Watcher(vm, expr, (newValue) => {
      // 触发订阅时，按照之前的规则，对节点进行更新
      updaterFn && updaterFn(node, newValue);
    });

    // 3. 视图到模型
    node.addEventListener('input', (e)=>{
      // 获取输入框的新值
      var newValue = e.target.value;

      console.log('newValue: ', newValue)

      // 把值放入到数据
      vm.$data[expr] = newValue;
    })
  },

  // 更新规则对象
  updater: {
    // 文本更新方法
    textUpdater(node, value){
      console.log('value: ', value);
      // alert('textUpdater')
      node.textContent = value;
      // debugger;
    },
    // 输入框更新方法
    modelUpdater(node, value){
      node.value = value;
    }
  }

}
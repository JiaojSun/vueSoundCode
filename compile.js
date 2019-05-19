// 用法 new Compile(el, vm)
class Compile{
    constructor(el, vm){
        // 要遍历的宿主节点
        this.$el = document.querySelector(el)
        this.$vm = vm;

        // 开始编译
        if(this.$el){
            // 先转换内部的内容为片段
            this.$fragment = this.node2Fragment(this.$el)
            // 执行编译
            this.compile(this.$fragment)
            // 将编译完成的HTML追加至￥el
            this.$el.appendChild(this.$fragment);
        }
    }

    // 将宿主元素中代码片段拿出来遍历，这样做比较高校
    node2Fragment(el){
        const frag = document.createDocumentFragment()
        // 将el中所有子元素搬家至frag中
        let child;
/*         while (条件) {
            需要执行的代码
        } */
        while (child = el.firstChild) {
            // appendChild() 方法可向节点的子节点列表的末尾添加新的子节点。
            frag.appendChild(child)
        }
        return frag
    }

    compile(el){
        const childNodes = el.childNodes;
        Array.from(childNodes).forEach(node => {
            // 类型判断
            if(this.isElement(node)) {
                // 元素
                // 查找k-,@
                const nodeAttrs = node.attributes;
                Array.from(nodeAttrs).forEach(attr => {
                    const attrName = attr.name;//屬性名
                    const exp = attr.value;//屬性值
                    if(this.isDirective(attrName)){
                        // k-text
                        const dir = attrName.substring(2)
                        // 執行指令
                        this[dir] && this[dir](node,this.$vm,exp)
                    }
                    if(this.isEvent(attrName)){
                        const dir = attrName.substring(1);//@click
                        this.eventHandler(node,this.$vm,exp,dir);
                    }
                })
                console.log('编译元素'+node.nodeName)
            }else if(this.isInterpolation(node)) {
                // 插值文本
                console.log("编译文本"+node.textContent)
                this.compileText(node)
            }

            // 递归子节点
            if(node.childNodes && node.childNodes.length > 0){
                this.compile(node)
            }
        })
    }

    compileText(node){
        // console.log(RegExp.$1);
        // node.textContent = this.$vm.$data[RegExp.$1]
        this.update(node, this.$vm, RegExp.$1, 'text')
    }

    // 更新函数
    update(node, vm, exp, dir) {
        const updateFn = this[dir+'Updater']
        // 初始化
        updateFn && updateFn(node, vm[exp]);
        // 依赖收集
        new Watcher(vm, exp, function(value) {
            updateFn && updateFn(node, value);
        })
    }

    text(node,vm,exp){
        this.update(node, vm, exp, 'text')
    }

    model(node,vm,exp){
        // 指定input的value屬性
        this.update(node,vm,exp,'model');

        // 视图对模型响应
        node.addEventListener('input',e=>{
            vm[exp] = e.target.value;
        });
    }

    modelUpdater(node,value){
        node.value = value;
    }

    html(node,vm,exp){
        this.update(node, vm, exp, 'html')
    }

    htmlUpdater(node,value){
        node.innerHTML = value;
    }

    // 事件處理器
    eventHandler(node, vm, exp, dir){
        // @click = changeName
        let fn = vm.$options.methods && vm.$options.methods[exp];
        if(dir && fn) {
            node.addEventListener(dir,fn.bind(vm));
        }
    }

    textUpdater(node, value) {
        node.textContent = value;
        // updateFn && updateFn(node, vm.$data[exp]);

    }

    isDirective(attr) {
        return attr.indexOf('k-') == 0;
    }

    isEvent(attr) {
        return attr.indexOf('@') == 0;
    }

    isElement(node) {
        return node.nodeType === 1;
    }
    // 插值文本
    isInterpolation(node) {
        return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent)
    }
}
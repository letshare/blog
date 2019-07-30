function wireLessTplV2(source) {
    var div = document.createElement('div');
    div.style.display = 'none';
    div.innerHTML = source;
    var renderDom = document.createElement('div');
    var resultDom = document.createElement('div');
    var tplDom = div.querySelector('script');
    var tpl = tplDom.innerHTML;
    renderDom.innerHTML = tpl;
    var viewTagIndex = 'vm-data';
    var viewDataIndex = 'viewData';
    var privateViewDataIndex = '_viewData';
    var parentAttrPath='';
    var viewData = {};
    var UUID=Date.now();

    function walk(dom) {
        var list = [dom];
        var target=[];
        var prop = "";
        while (list.length > 0) {
            var tagNode = list.shift();
            var tagData = tagNode.getAttribute(viewTagIndex);
            if (tagData) {
                target.push([tagNode,tagData]);
            }
            for (var i = 0; i < tagNode.children.length; i++) {
                list.push(tagNode.children[i]);
            }
        }
        while(target.length>0){
            var item=target.pop();
            prop = prop + '\n' + tagHandle(item[0], item[1]);
        }
        return prop;
    }

    function getDomId(dom) {
        var domId = dom.getAttribute('id');
        if (!domId) {
            var randLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            var uniqId = randLetter + (UUID++);
            dom.setAttribute('id', uniqId);
            return uniqId;
        }
        return domId;
    }

    function propertyDefinedHeader(attrPrefix,attrName,code){
        return '\n\tObject.defineProperty(' + viewDataIndex+(attrPrefix?'.'+attrPrefix:'') +',"' + attrName + '",' + code + ');';
    }

    var tagController = {
        evt: function(dom,params,attrPrefix,attrName,attrPath, cntl) {
            var domId = getDomId(dom);
            var c = "{\n\
        set:function(data){\n\
            $('#" + domId + "').off('"+cntl+"');\n\
            if(data){\n\
                $('#" + domId + "').on('"+cntl+"',data);\n\
            }\n\
        }\n\
\t}";
            c = propertyDefinedHeader(attrPrefix,attrName,c);
            return c;
        },
        html: {

            tpl:function(dom,params,attrPrefix,attrName,attrPath,cntl,callbackList){
                var domId=getDomId(dom);
                var tpl=dom.innerHTML.replace(/\n|\t/g, '');
                var rtpl='';
                while(tpl.indexOf('{{')>=0){
                    var index=tpl.indexOf('{{');
                    rtpl=rtpl+"com=com+'"+tpl.substr(0,index)+"';\n";
                    tpl=tpl.substr(index+2);
                    index=tpl.indexOf('}}');
                    if(/^( +)?\=/.test(tpl)){
                        rtpl=rtpl+"var temp"+tpl.substr(0,index)+';com=com+temp;\n';
                    }else{
                        rtpl=rtpl+tpl.substr(0,index)+'\n';
                    }
                    tpl=tpl.substr(index+2);
                }
                //尾部
                rtpl=rtpl+"com=com+'"+tpl+"';\n";
                tpl="function(dataItem,dataIndex,dataLenth){var com='';"+rtpl+"return com;}";
                var cbf=function(d){
                    d.innerHTML="";
                }
                callbackList.push(cbf);
                var c = "{\n\
        get:function(){\n\
            return " + privateViewDataIndex + "." + attrPath +";\n\
        },\n\
        set:function(data){\n\
            " + privateViewDataIndex + "." + attrPath + "=data;\n\
            var html='';\n\
            var tpl=" + tpl + ";\n\
            if(Object.prototype.toString.apply(data)=='[object Array]'){\n\
                for(var i=0;i<data.length;i++){\n\
                    var dataItem=data[i];\n\
                    var hc=tpl(dataItem,i,data.length);\n\
                    html=html+hc;\n\
                }\n\
            }else{\n\
                html=tpl(data);\n\
            }\n\
            $('#" + domId + "').html(html);\n\
        }\n\
\t}";
                c = propertyDefinedHeader(attrPrefix,attrName,c);
                //auto innerAppend
                var ca = "{\n\
            set:function(data){\n\
                " + privateViewDataIndex + "." + attrPath + "=data;\n\
                var html='';\n\
                var tpl=" + tpl + ";\n\
                if(Object.prototype.toString.apply(data)=='[object Array]'){\n\
                    for(var i=0;i<data.length;i++){\n\
                        var dataItem=data[i];\n\
                        var hc=tpl(dataItem);\n\
                        html=html+hc;\n\
                    }\n\
                }else{\n\
                    html=tpl(data);\n\
                }\n\
                $('#" + domId + "').append(html);\n\
            }\n\
\t}";
                c =c+ propertyDefinedHeader(attrPrefix,attrName+"_add",ca);
                //auto innerInsertBefore
                var ca = "{\n\
            set:function(data){\n\
                " + privateViewDataIndex + "." + attrPath + "=data;\n\
                var html='';\n\
                var tpl=" + tpl + ";\n\
                if(Object.prototype.toString.apply(data)=='[object Array]'){\n\
                    for(var i=0;i<data.length;i++){\n\
                        var dataItem=data[i];\n\
                        var hc=tpl(dataItem);\n\
                        html=html+hc;\n\
                    }\n\
                }else{\n\
                    html=tpl(data);\n\
                }\n\
                $('#" + domId + "').children().length>0?$('#" + domId + "').children().first().before(html): $('#" + domId + "').append(html);\n\
            }\n\
\t}";
                c =c+ propertyDefinedHeader(attrPrefix,attrName+"_before",ca);
                //auto innerRemove
                var cr= "{\n\
            set:function(id){\n\
                return $('#" + domId + " [vm-param=tplRemove-'+id+']').remove();\n\
            }\n\
\t}";
                c =c+ propertyDefinedHeader(attrPrefix,attrName+"_remove",cr);
                return c;
            },
            innerRepeat: function(dom,params,attrPrefix,attrName,attrPath,cntl,callbackList) {
                var domId = getDomId(dom);
                var tpl = dom.innerHTML.replace(/^[\n\t ]+/, '').replace(/[\n\t ]+$/, '');
                var cbf=function(d){
                    d.innerHTML="";
                }
                callbackList.push(cbf);
                var c = "{\n\
        get:function(){\n\
            return " + privateViewDataIndex + "." + attrPath +";\n\
        },\n\
        set:function(data){\n\
            " + privateViewDataIndex + "." + attrPath + "=data;\n\
            var html='';\n\
            var tpl='" + tpl.replace(/\n|\t/g, '') + "';\n\
            for(var i=0;i<data.length;i++){\n\
                var dataItem=data[i];\n\
                var hc=tpl;\n\
                var m=tpl.match(/{{[^}]*}}/g);\n\
                if(m){\n\
                    for(var j=0;j<m.length;j++){\n\
                        var key=m[j].replace(/[{}]/g,'');\n\
                        var val=dataItem[key];\n\
                        if(Object.prototype.toString.apply(val)=='[object Array]'){\n\
                            val="+privateViewDataIndex+"[key](val);\n\
                        }\n\
                        hc=hc.replace(/\{\{_index\}\}/g,j);\n\
                        hc=hc.replace(new RegExp(m[j],'g'),val);\n\
                    }\n\
                }\n\
                html=html+hc;\n\
            }\n\
            $('#" + domId + "').html(html);\n\
        }\n\
\t}";
                c = propertyDefinedHeader(attrPrefix,attrName,c);
                //auto innerAppend
                var ca = "{\n\
            set:function(data){\n\
                " + privateViewDataIndex + "." + attrPath + "=data;\n\
                var tpl='" + tpl.replace(/\n|\t/g, '') + "';\n\
                var dataItem=data;\n\
                var hc=tpl;\n\
                var m=tpl.match(/{{[^}]*}}/g);\n\
                if(m){\n\
                    for(var j=0;j<m.length;j++){\n\
                        var val=dataItem[m[j].replace(/[{}]/g,'')];\n\
                        hc=hc.replace(new RegExp(m[j],'g'),val);\n\
                    }\n\
                }\n\
                $('#" + domId + "').append(hc);\n\
            }\n\
\t}";
                c =c+ propertyDefinedHeader(attrPrefix,attrName+"_add",ca);
                //auto innerRemove
                var cr= "{\n\
            set:function(id){\n\
                return $('#" + domId + " [vm-param=innerRemove-'+id+']').remove();\n\
            }\n\
\t}";
                c =c+ propertyDefinedHeader(attrPrefix,attrName+"_remove",cr);
                return c;
            },
            subRepeat:function(dom,params,attrPrefix,attrName,attrPath,cntl,callbackList){
                var domId = getDomId(dom);
                var tpl = dom.innerHTML.replace(/^[\n\t ]+/, '').replace(/[\n\t ]+$/, '');
                var cbf=(function(attrPath){
                    return function(d){
                        d.innerHTML="{{"+attrPath+"}}";
                    }
                })(attrPath);
                callbackList.push(cbf);

                var c=privateViewDataIndex+"."+attrPath+"=function(data){\n\
        var html='';\n\
        var tpl='" + tpl.replace(/\n|\t/g, '') + "';\n\
        for(var i=0;i<data.length;i++){\n\
            var dataItem=data[i];\n\
            var hc=tpl;\n\
            var m=tpl.match(/{{[^}]*}}/g);\n\
            if(m){\n\
                for(var j=0;j<m.length;j++){\n\
                    var val=dataItem[m[j].replace(/[{}]/g,'')];\n\
                    hc=hc.replace(new RegExp(m[j],'g'),val);\n\
                }\n\
            }\n\
            html=html+hc;\n\
        }\n\
        return html;\n\
    }";
                return "\t"+c;
            },
            getNodes:function(dom,params,attrPrefix,attrName,attrPath){
                var domId=getDomId(dom);
                var c= "{\n\
        get:function(){\n\
            return $('#" + domId + " [vm-param=nodes-"+attrPath+"],#" + domId + "[vm-param=nodes-"+attrPath+"]');\n\
        }\n\
    }";
                c = propertyDefinedHeader(attrPrefix,attrName,c);
                return c;
            },
            eachNode:function(dom,params,attrPrefix,attrName,attrPath){
                 var domId=getDomId(dom);
                var c= "{\n\
        set:function(callback){\n\
            var nodes=$('#" + domId + " [vm-param=eachNode-"+attrPath+"],#" + domId + "[vm-param=eachNode-"+attrPath+"]');\n\
            $.each(nodes,callback);\n\
        }\n\
    }";
                c = propertyDefinedHeader(attrPrefix,attrName,c);
                return c;
            },
            place: function(dom,params,attrPrefix,attrName,attrPath) {
                var domId = getDomId(dom);

                var c = "{\n\
        get:function(){\n\
            return $('#" + domId + "').html();\n\
        },\n\
        set:function(data){\n\
            "+((params&&params['placeFixSet'])?'data='+params['placeFixSet'].replace('$data','data')+';':'')+"\n\
            $('#" + domId + "').html(data);\n\
        }\n\
\t}";
                c = propertyDefinedHeader(attrPrefix,attrName,c);
                return c;
            },
            scroller:function(dom,params,attrPrefix,attrName,attrPath){
                var domId = getDomId(dom);

                var c = "{\n\
        get:function(){\n\
            return " + privateViewDataIndex + "." + attrPath +";\n\
        },\n\
        set:function(data){\n\
            var cfg={"+params['scroller']+"};\n\
            " + privateViewDataIndex + "." + attrPath + "=new data($('#" + domId + "')[0],cfg);\n\
        }\n\
\t}";
                c = propertyDefinedHeader(attrPrefix,attrName,c);
                return c;
            }
        },
        attr: {
            input: function(dom,params,attrPrefix,attrName,attrPath) {
                var domId = getDomId(dom);
                var c = "{\n\
        get:function(){\n\
            return $('#" + domId + "').val();\n\
        },\n\
        set:function(data){\n\
            $('#" + domId + "').val(data);\n\
        }\n\
\t}";
                c = propertyDefinedHeader(attrPrefix,attrName,c);
                return c;
            },
            style: function(dom,params,attrPrefix,attrName,attrPath, cntl) {
                var domId = getDomId(dom);
                var c = "{\n\
        get:function(){\n\
            return $('#" + domId + "').css('" + cntl + "');\n\
        },\n\
        set:function(data){\n\
            $('#" + domId + "').css('" + cntl + "',data);\n\
        }\n\
\t}";
                c = propertyDefinedHeader(attrPrefix,attrName,c);
                return c;
            },
            dom:function(dom,params,attrPrefix,attrName,attrPath,cntl){
                var domId=getDomId(dom);
                var c = "{\n\
        get:function(){\n\
            return $('#" + domId + "').attr('" + cntl + "');\n\
        },\n\
        set:function(data){\n\
            $('#" + domId + "').attr('" + cntl + "',data);\n\
        }\n\
\t}";
                c = propertyDefinedHeader(attrPrefix,attrName,c);
                return c;
            },
            class: function(dom,params,attrPrefix,attrName,attrPath, cntl) {
                var domId = getDomId(dom);
                var c = "{\n\
        get:function(){\n\
            return $('#" + domId + "').attr('class');\n\
        },\n\
        set:function(data){\n\
            $('#" + domId + "').attr('class',data);\n\
        }\n\
\t}";
                c = propertyDefinedHeader(attrPrefix,attrName,c);
                return c;
            },
            src: function(dom,params,attrPrefix,attrName,attrPath, cntl) {
                var domId = getDomId(dom);
                var c = "{\n\
        get:function(){\n\
            return $('#" + domId + "').attr('src');\n\
        },\n\
        set:function(data){\n\
            $('#" + domId + "').attr('src',data);\n\
        }\n\
\t}";
                c = propertyDefinedHeader(attrPrefix,attrName,c);
                return c;
            },
            href: function(dom,params,attrPrefix,attrName,attrPath, cntl) {
                var domId = getDomId(dom);
                var c = "{\n\
        get:function(){\n\
            return $('#" + domId + "').attr('href');\n\
        },\n\
        set:function(data){\n\
            $('#" + domId + "').attr('href',data);\n\
        }\n\
\t}";
                c = propertyDefinedHeader(attrPrefix,attrName,c);
                return c;
            },
            checked: function(dom,params,attrPrefix,attrName,attrPath, cntl) {
                var domId = getDomId(dom);
                var c = "{\n\
        get:function(){\n\
            return $('#" + domId + "').prop('checked');\n\
        },\n\
        set:function(data){\n\
            $('#" + domId + "').prop('checked',data);\n\
        }\n\
\t}";
                c = propertyDefinedHeader(attrPrefix,attrName,c);
                return c;
            }

        }
    }

    function tagHandle(dom, tag) {
        console.log(tag);
        var tl = tag.split(';');
        var tagHandleStr = '';
        //callback用于标签处理完成后要做的后续动作，一般在标签处理函数中添加
        var cntlCallback=[];
        for (var i = 0; i < tl.length; i++) {
            var tagData = tl[i].split('@');
            var dataAttr = tagData[1].split('.');
            var dataNode = viewData;
            var attrPrefix = '';
            var lastAttr = dataAttr[dataAttr.length - 1];
            for (var di = 0; di < dataAttr.length - 1; di++) {
                var attrName = dataAttr[di];
                attrPrefix = (attrPrefix==''?attrPrefix:attrPrefix+'.') + attrName;
                if (!dataNode[attrName]) {
                    dataNode[attrName] = {};
                    tagHandleStr = tagHandleStr + '\n\tviewData.' + attrPrefix + '={};';
                    tagHandleStr = tagHandleStr + '\n\t_viewData.' + attrPrefix + '={};';
                }
                dataNode = dataNode[attrName];
            }
            var cntlData = tagData[0].split('.');
            var cntl = tagController;
            for (var ci = 0; ci < cntlData.length; ci++) {
                if (typeof(cntl[cntlData[ci]]) == 'object') {
                    cntl = cntl[cntlData[ci]];
                } else if (typeof(cntl[cntlData[ci]]) == 'function') {
                    cntl = cntl[cntlData[ci]];
                    break;
                } else {
                    return '';
                }
            }
            var param=dom.getAttribute('vm-param');

            if(param){
                var paramData={};
                var pl=param.split(';');
                for(var k=0;k<pl.length;k++){
                    var pdata=pl[k].split('-');
                    paramData[pdata[0]]=pdata[1];
                }
            }else{
                var paramData=false;
            }
            var code = cntl(dom,paramData, attrPrefix,lastAttr,tagData[1], cntlData[cntlData.length - 1],cntlCallback);
            tagHandleStr = tagHandleStr+code;
        }
        for(var i=0;i<cntlCallback.length;i++){
            cntlCallback[i](dom);
        }
        dom.removeAttribute(viewTagIndex);
        return tagHandleStr;
    }
    var d = 'define(\'' + tplDom.id + '\',function(require, exports, module) {';
    var p = walk(renderDom).replace(/(\&gt\;)/g,">").replace(/(\&lt\;)/g,"<");
    var tplContainer = tplDom.getAttribute('container') ? tplDom.getAttribute('container') : 'body';
    var attrs=tplDom.attributes;
    var attrStr=[];
    for(var i=0;attr=attrs.item(i);i++){
        attrStr.push('\texports["'+attr.nodeName+'"]="'+attr.nodeValue+'";');
    }
    var h = '\tvar $ = require(\'{jquery}\');\n\
    exports["selector"] = \'' + tplContainer + '\';\n\
'+attrStr.join('\n')+'\n\
    var viewData={};\n\
    var _viewData={};\n\
    exports["viewData"]=viewData;';
    var dep = 'exports.addCss();\n';
    var dependence=tplDom.getAttribute('dep');
    if(dependence){
        dependence=dependence.split(';');
        for(var j=0;j<dependence.length;j++){
            dep=dep+'\t\trequire("'+dependence+'");\n';
        }
    }
    var cf='\texports["viewData"].applyData=function(source){\n\
        var list=[[source,viewData]];\n\
        while(list.length>0){\n\
            var target=list.shift();\n\
            var s=target[0];\n\
            var t=target[1];\n\
            for(var i in s){\n\
                if(Object.prototype.toString.apply(s[i])=="[object Object]"&&Object.prototype.toString.apply(t[i])=="[object Object]"){\n\
                    list.push([s[i],t[i]]);\n\
                }else{\n\
                    t[i]=s[i];\n\
                }\n\
            }\n\
        }\n\
    }';
    var t = '\texports.template = function(){\n\
        ' + dep + '\n\
        var t=\
\'' + renderDom.innerHTML.replace(/[\n\r]/g, '').replace(/^[\t ]+/, '').replace(/[\t ]+$/, '') + '\';\n\
        return t;\n\
    }';
    var css='\texports.removeCss=function(){\n\
        var css=exports["css"];\n\
        if(css){\n\
            var styles=document.getElementsByTagName("link");\n\
            for (var i=styles.length; i>=0; i--){\n\
                if(styles[i]){\n\
                    var alias=styles[i].getAttribute("href");\n\
                    if(alias&&css.indexOf(alias)>=0){\n\
                        styles[i].parentNode.removeChild(styles[i]);\n\
                    }\n\
                }\n\
            }\n\
        }\n\
    }\n\
    exports.addCss=function(){\n\
        var css=exports["css"];\n\
        if(css){\n\
            var styles=document.getElementsByTagName("link");\n\
            var already=[];\n\
            for (var i=styles.length; i>=0; i--){\n\
                if(styles[i]){\n\
                    var alias=styles[i].getAttribute("href");\n\
                    if(alias){\n\
                        already.push(alias);\n\
                    }\n\
                }\n\
            }\n\
            css=css.split(";");\n\
            already=already.join(";");\n\
            for(var i=0;i<css.length;i++){\n\
                if(already.indexOf(css[i])==-1){\n\
                    var l = document.createElement("link");\n\
                    l.setAttribute("type", "text/css");\n\
                    l.setAttribute("rel", "stylesheet");\n\
                    l.setAttribute("href", css[i]);\n\
                    document.getElementsByTagName("head")[0].appendChild(l);\n\
                }\n\
            }\n\
        }\n\
    }\n';

    var f = '});'
    return {
        code:[d, h, cf ,p, t, css, f].join('\n'),
        source:source,
        id:tplDom.id
    };
}

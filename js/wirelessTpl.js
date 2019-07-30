function wireLessTpl(source) {
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
    var viewData = {};
    var UUID=Date.now();

    function walk(dom) {
        var list = [dom];
        var prop = "";
        while (list.length > 0) {
            var tagNode = list.shift();
            var tagData = tagNode.getAttribute(viewTagIndex);
            if (tagData) {
                prop = prop + '\n' + tagHandle(tagNode, tagData);
            }
            for (var i = 0; i < tagNode.children.length; i++) {
                list.push(tagNode.children[i]);
            }
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
    var tagController = {
        html: {
            innerRepeat: function(dom, attrPath) {
                var domId = getDomId(dom);
                var tpl = dom.innerHTML.replace(/^[\n\t ]+/, '').replace(/[\n\t ]+$/, '');
                dom.innerHTML = '';
                var c = "{\n\
		get:function(){\n\
			return " + privateViewDataIndex + '.' + attrPath + ";\n\
		},\n\
		set:function(data){\n\
			" + privateViewDataIndex + '.' + attrPath + "=data;\n\
			var html='';\n\
			var tpl='" + tpl.replace(/\n|\t/g, '') + "';\n\
			for(var i=0;i<data.length;i++){\n\
				var dataItem=data[i];\n\
				var hc=tpl;\n\
				for(var j in dataItem){\n\
					hc=hc.replace(new RegExp('{{'+j+'}}','g'),dataItem[j]);\n\
				}\n\
				html=html+hc;\n\
			}\n\
			$('#" + domId + "').html(html);\n\
		}\n\
\t}";
                return c;
            },
            place: function(dom, attrPath) {
                var domId = getDomId(dom);
                var c = "{\n\
		get:function(){\n\
			return $('#" + domId + "').html();\n\
		},\n\
		set:function(data){\n\
			$('#" + domId + "').html(data);\n\
		}\n\
\t}";
                return c;
            }
        },
        attr: {
            input: function(dom, attrPath) {
                var domId = getDomId(dom);
                var c = "{\n\
		get:function(){\n\
			return $('#" + domId + "').val();\n\
		},\n\
		set:function(data){\n\
			$('#" + domId + "').val(data);\n\
		}\n\
\t}";
                return c;
            },
            style: function(dom, attrPath, cntl) {
                var domId = getDomId(dom);
                var c = "{\n\
		get:function(){\n\
			return $('#" + domId + "').css('" + cntl + "');\n\
		},\n\
		set:function(data){\n\
			$('#" + domId + "').css('" + cntl + "',data);\n\
		}\n\
\t}";
                return c;
            },
            class: function(dom, attrPath, cntl) {
                var domId = getDomId(dom);
                var c = "{\n\
		get:function(){\n\
			return $('#" + domId + "').attr('class');\n\
		},\n\
		set:function(data){\n\
			$('#" + domId + "').attr('class',data);\n\
		}\n\
\t}";
                return c;
            },
            src: function(dom, attrPath, cntl) {
                var domId = getDomId(dom);
                var c = "{\n\
        get:function(){\n\
            return $('#" + domId + "').attr('src');\n\
        },\n\
        set:function(data){\n\
            $('#" + domId + "').attr('src',data);\n\
        }\n\
\t}";
                return c;
            }
        }
    }

    function tagHandle(dom, tag) {
        console.log(tag);
        var tl = tag.split(';');
        var tagHandleStr = '';
        for (var i = 0; i < tl.length; i++) {
            var tagData = tl[i].split('@');
            var dataAttr = tagData[1].split('.');
            var dataNode = viewData;
            var attrPrefix = '';
            var lastAttr = dataAttr[dataAttr.length - 1];
            for (var di = 0; di < dataAttr.length - 1; di++) {
                var attrName = dataAttr[di];
                attrPrefix = attrPrefix + '.' + attrName;
                if (!dataNode[attrName]) {
                    dataNode[attrName] = {};
                    tagHandleStr = tagHandleStr + '\n\tviewData' + attrPrefix + '={};';
                    tagHandleStr = tagHandleStr + '\n\t_viewData' + attrPrefix + '={};';
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
            var code = cntl(dom, tagData[1], cntlData[cntlData.length - 1]);
            tagHandleStr = tagHandleStr + '\n\tObject.defineProperty(' + viewDataIndex + attrPrefix + ',"' + lastAttr + '",' + code + ');';
        }
        dom.removeAttribute(viewTagIndex);
        return tagHandleStr;
    }
    var d = 'define(\'ctrl.' + tplDom.id + '\',function(require, exports, module) {';
    var p = walk(renderDom);
    var tplContainer = tplDom.getAttribute('container') ? tplDom.getAttribute('container') : 'body';
    var attrs=tplDom.attributes;
    var attrStr=[];
    for(var i=0;attr=attrs.item(i);i++){
        attrStr.push('    exports["'+attr.nodeName+'"]="'+attr.nodeValue+'";');
    }
    var h = '\tvar $ = require(\'{jquery}\');\n\
	exports.selector = \'' + tplContainer + '\';\n\
'+attrStr.join('\n')+'\n\
	var viewData={};\n\
	var _viewData={};\n\
	exports.viewData=viewData;';
    var dep = tplDom.getAttribute('css');
    dep = dep ? 'require.css(\'' + dep.split(',').join('\');\n\t\trequire.css(\'') + '\');' : '';
    var t = '\texports.template = function(){\n\
		' + dep + '\n\
		var t=\
\'' + renderDom.innerHTML.replace(/[\n\r]/g, '').replace(/^[\t ]+/, '').replace(/[\t ]+$/, '') + '\';\n\
		return t;\n\
}';
    var f = '});'
    return {
    	code:[d, h, p, t, f].join('\n'),
    	source:source,
    	id:tplDom.id
    };
}
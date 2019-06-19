## 关于错误处理
看react分享看到domain，然后深入了解，domain处于废除状态，那么替代domain的方案是什么呢？
于是看到node服务处理错误的解决方案https://www.kancloud.cn/feng003/node/322376，它推荐了一个好用的库verror
提到了一些问题，比如很多业务不合理的使用 uncaughtException


java强制处理错误，ts通过类型检查做到一部分防御性编程，我们的业务代码中也有人有好的习惯使用assert做防御性编程

《防御性编程的介绍和技巧》
http://blog.jobbole.com/101651/
相关的一篇文章《一道题识别优秀的程序员》
http://blog.jobbole.com/101801/?utm_source=blog.jobbole.com&utm_medium=relatedPosts

只有处理好了错误，程序才能更健壮！

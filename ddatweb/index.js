(function(){
    const serverUrl = 'wss://cluster.vtbs.moe/';

    function getCookie(name) {
        var arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
        if (arr = document.cookie.match(reg))
            return (arr[2]);
        else
            return null;
    }

    function setCookie (c_name, value, expiredays) {
        var exdate = new Date();
        exdate.setDate(exdate.getDate() + expiredays);
        document.cookie = c_name + "=" + escape(value) + ((expiredays == null) ? "" : ";expires=" + exdate.toGMTString());
    }

    var vm = new Vue({
        el: "#app",
        data: {
            nickname: "DD",
            interval: 500,
            running: false,
            totalJobs: 0,
            thisSessionJobs: 0,
            url: serverUrl,
            log: ""
        },
        methods: {
            toggleStartPause: function() {
                vm.running ^= 1;
                setUp();
            },
            updateInformation: function() {
                if (vm.interval < 10) vm.interval = 10;
                vm.url = `${serverUrl}?runtime=web&version=0.1.0&platform=${encodeURIComponent(window.navigator.platform)}&name=${encodeURIComponent(vm.nickname)}`;
                setCookie('nickname', vm.nickname, 2434);
                setCookie('interval', vm.interval, 2434);
                setUp();
            }
        }
    });

    function loadCookies() {
        if (getCookie('nickname')) vm.nickname = getCookie('nickname');
        if (getCookie('interval')) vm.interval = getCookie('interval');
        if (getCookie('totalJobs')) vm.totalJobs = getCookie('totalJobs');
        vm.updateInformation();
    }

    function log(head, body) {
        logElement = document.getElementById('log');
        atBottom = logElement.scrollTop > logElement.scrollHeight - logElement.offsetHeight - 2;
        vm.log += `[${new Date().toLocaleString().toLocaleString()}][${head}]\n${body}\n`;
        if (atBottom) {
            Vue.nextTick(function() {
                logElement.scrollTop = logElement.scrollHeight;
            });
        }
    }

    function httpGet(theUrl) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("GET", theUrl, false); // false for synchronous request
        xmlHttp.send(null);
        if (xmlHttp.status == 200) return xmlHttp.responseText;
        else return null;
    }

    var timer;
    var ws;

    function setUp() {
        if (timer) clearInterval(timer);
        if (ws) ws.close();
        if (vm.running) {
            log('connect', 'began');
            ws = new WebSocket(vm.url);
            ws.onerror = function(e) {
                log('error', e);
            };
            ws.onclose = function() {
                log('close', 'closed');
            };
            ws.onmessage = function(e) {
                log('receive', e.data);
                recv = JSON.parse(e.data);
                key = recv.key;
                apiUrl = recv.data.url;
                apiData = httpGet(apiUrl);
                if (apiData == null) {
                    log('api', `Failed to get ${apiUrl}`);
                } else {
                    res = JSON.stringify({
                        'key': key,
                        'data': apiData
                    });
                    log('send', res);
                    ws.send(res);
                    ++vm.thisSessionJobs;
                    ++vm.totalJobs;
                    setCookie('totalJobs', vm.totalJobs, 2434);
                }
                timer = setTimeout(function() {
                    log('send', 'DDhttp');
                    ws.send('DDhttp');
                }, vm.interval);
            };
            ws.onopen = function() {
                log('connect', 'succeeded');
                timer = setTimeout(function() {
                    log('send', 'DDhttp');
                    ws.send('DDhttp');
                }, vm.interval);
            }
        }
    }

    loadCookies();
})()

var socket;
var tasks = {lightoff:"关灯", lighton:"开灯", curon:"窗帘打开", curoff:"窗帘关闭", airon:"空调开启，同时开启制冷模式", airoff:"空调关闭", cookeron:"开启电饭煲", cookeroff:"关闭电饭煲"};

//Create a JSON style object for the margin
var margin = {
    top: 10,
    right: 20,
    bottom: 20,
    left: 20
};

/*
Function: validateIP()
Description: Attempt to connect to server/Intel IoT platform
*/
function validateIP() {
    'use strict';
    
    //Get values from text fields
    var ip_addr = $("#ip_address").val(),
    port = $("#port").val(),
    script = document.createElement("script");

    //create script tag for socket.io.js file located on your IoT platform (development board)
    //script.setAttribute("src", "http://" + ip_addr + ":" + port + "/socket.io/socket.io.js");
    script.setAttribute("src", "https://cdn.socket.io/socket.io-1.4.5.js");
    document.head.appendChild(script);
    
    //Wait 1 second before attempting to connect
    setTimeout(function(){
        try {
            //Connect to Server
            socket = io.connect("http://" + ip_addr + ":" + port);

            //Attach a 'connected' event handler to the socket
            socket.on("connected", function (message) {
                //Apache Cordova Notification
                navigator.notification.alert(
                    "非常好!",  // message
                    "",                     // callback
                    '你已连接',            // title
                    '确认'                  // buttonName
                );

                //Set all Back button to not show
                $.ui.showBackButton = false;
                //Load page with transition
                $.ui.loadContent("#scene_list", false, false, "fade");
                get_scheduler();
            });

        } catch (e) {
            navigator.notification.alert(
                "服务不可用!",  // message
                "",                     // callback
                '连接错误!',            // title
                '确认'                  // buttonName
            );
        }
    }, 1000);
}

//保存新场景，服务端进行数据库存储
function save_scene()
{
    'use strict';
    var all = JSON.stringify(store.getAll());
    var scene_name = document.getElementById("scene_name").value;
    var tasklistlength = document.getElementById('tasklist').childNodes.length;
    if(scene_name == ""){
        alert("请输入场景名称！");
    }
    else if(tasklistlength == 1){
        alert("请添加任务！");
    }
    else{
        var scene = {name:scene_name, value:all};
        socket.emit('new_scene', scene);
        clear_task();
        socket.on('scene_r', function(){
            var li=document.createElement("li");
            var scenelist = document.getElementById("scenelist");
            scenelist.appendChild(li);
            var a = document.createElement("a");
            a.innerHTML=scene_name;
            a.onclick=function(){
                get_scene(this.innerHTML);
            }
            li.appendChild(a);
        });
    }
}

//清除任务
function clear_task(){
    store.clear();
    $("#tasklist li").remove("li");//移除li列表
    $.ui.showBackButton = false;
    $.ui.loadContent("#scene_list", false, false, "fade");
}


function init() {
    if (!store.enabled) {
        alert('Local storage is not supported by your browser. Please disable "Private Mode", or upgrade to a modern browser.')
        return
    }
}

//读取新场景
function get_scheduler(){
    socket.emit('getsche', 'getsche');
    socket.on('revsche', function(sche){
        $("#scenelist li").remove();
        if(sche != null)
            for(var s in sche){
                //var usche = sche[s].scene_name;
                var li=document.createElement("li");
                var scenelist = document.getElementById("scenelist");
                scenelist.appendChild(li);
                var a = document.createElement("a");
                a.innerHTML=sche[s].scene_name
                a.onclick=function(){
                    get_scene(this.innerHTML);
                }
                li.appendChild(a);
            }
    });
}

//保存任务
function save_task(){
    var ntime = document.getElementById("num").value;
    if(ntime == ""){
        alert('请输入定时时间');
    }
    else{
        var nid = document.getElementById('select_k1').value;
        var all = store.getAll();
        var i = 0;
        for(var p in all){
            i = i + 1;
        }
        var list = {id:nid, time:ntime};
        console.log(list);
        store.set(i+1,JSON.stringify(list));
        $.ui.showBackButton = false;
        $.ui.loadContent("#create_scene", false, false, "fade");
        var li=document.createElement("li");
        var name = document.createTextNode(tasks[nid] + " " + ntime + "秒");
        li.appendChild(name);
        var tasklist = document.getElementById("tasklist");
        tasklist.appendChild(li);
        var all = store.getAll();

        //调试代码
        console.log(all);
        for(var u in all)
        {
            console.log(JSON.parse(all[u]).id + " " + JSON.parse(all[u]).time);
        }
    }
}

//读取场景
function get_scene(scene){
    $.ui.showBackButton = false;
    $.ui.loadContent("#show_scene", false, false, "fade");
    $.ui.setTitle("场景名称:" + scene);
    
    socket.emit('get_scene', scene);
    socket.on("receive_scene", function(scedata){
        $("#tlist li").remove();
        store.set("scene_name", scene);
        //$("#show_screen").attr({"title": "场景名称" + scene});
       // document.getElementById("show_screen").title = "场景名称" + scene;
        var sce = JSON.parse(scedata);
        //var scenename = document.getElementById("scene");
        //scenename.innerHTML=scene;
        for(var s1 in sce){
            var js1 = JSON.parse(sce[s1]);
            var sid = js1.id;
            var stime = js1.time;
            var li=document.createElement("li");
            var name = document.createTextNode(tasks[sid] + " " + stime + "秒");
            li.appendChild(name);
            var tasklist = document.getElementById("tlist");
            tasklist.appendChild(li);
        }
          
    });
}

//执行场景
function submit(){
    var na = store.get("scene_name");
    socket.emit('submit', na);
    socket.on('receive_submit', function(){
        //Apache Cordova Notification
        navigator.notification.alert(
            "执行成功",  // message
            "",                     // callback
            '提示',            // title
            '确认'                  // buttonName
        );
    });
}

//创建新场景
function create_scene(){
    store.clear();
    $.ui.showBackButton = false;
    $.ui.loadContent("#create_scene", false, false, "fade");
}

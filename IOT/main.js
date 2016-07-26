var mraa = require("mraa");
var useUpmVersion = true;

var fs = require("fs");                                                  
if (!fs.existsSync("databases"))                                              
{  
    fs.mkdirSync("databases", function (err)                                      
    {     
        if (err) {  
            console.log(err);  
            return;  
        }  
    });  
}  
var sqlite3 = require('sqlite3');                                                
//初始化数据库  
var db = new sqlite3.Database('databases/SceneDB.sqlite3');                            
db.run("CREATE TABLE IF NOT EXISTS scene (id, scene_name, json_data)");   
db.close(); 

var LED = new mraa.Gpio(13);
LED.dir(mraa.DIR_OUT);

console.log("智能场景IOT");
console.log("http://try.elecfans.com");
console.log("by agdhun");
//Create Socket.io server
var http = require('http');
var app = http.createServer(function (req, res) {
    'use strict';
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('<h1>Hello world from Intel IoT platform!</h1>');
}).listen(8080);
var io = require('socket.io')(app);

//Attach a 'connection' event handler to the server
io.on('connection', function (socket) {
    'use strict';
    console.log('a user connected');
    //Emits an event along with a message
    socket.emit('connected', 'Welcome');
    //从数据库读取所有情景模式，下发
    socket.on('getsche', function(){
        //读取数据库，发送数据
        var db = new sqlite3.Database('databases/SceneDB.sqlite3');
        console.log(db);
        db.all("select scene_name from scene", function(err, res){
            if(!err){
                socket.emit('revsche', res);
            }
            else
                console.log(err);
        });
        db.close();
    });
    
    //存入新场景
    socket.on('new_scene', function(scene){
        var num = 0;
        console.log(scene);
        var db = new sqlite3.Database('databases/SceneDB.sqlite3');
        db.all("select scene_name from scene", function(err, res){
            if(!err){
                num = res.length + 1;
            }
            else
                console.log(err);
        });
        db.run("insert into scene (id, scene_name, json_data) values (" + num + ", '" + scene.name + "', '" + scene.value +"')");
        db.close();
        socket.emit('scene_r', 'successful');
    });
        
    //下发新场景
    socket.on('get_scene', function (scene){
        var db = new sqlite3.Database('databases/SceneDB.sqlite3');
        db.all("select json_data from scene where scene_name='" + scene + "'", function(err, res){
            if(!err){
                var jdata=(JSON.parse((res[0]).json_data));
                socket.emit('receive_scene', res[0].json_data);
                console.log(jdata);
            }
            else
                console.log(err);
        });
        db.close();
    });
    
    //执行新场景
    socket.on('submit', function(subname){
        console.log('received submit command');
        var json_data = null;
        var l1Text, l2Text;
        var thtemp = null;
        var ntime = 0;
        var db = new sqlite3.Database('databases/SceneDB.sqlite3');
        db.all("select json_data from scene where scene_name='" + subname + "'", function(err, res){
            if(!err){
                var ntime = 0;
                var jdata=JSON.parse(res[0].json_data);
                console.log(jdata);
                for(var n in jdata)
                {
                    var th = JSON.parse(jdata[n]);
                    ntime = ntime + parseInt(th.time);
                    if(th.id == 'lighton')
                        setTimeout(function(){
                            show('Light ON');
                        }, ntime * 1000);
                    else if(th.id == 'lightoff')
                        setTimeout(function(){
                            show('Light OFF');
                        }, ntime * 1000);
                    else if(th.id == 'curon')
                        setTimeout(function(){
                            show('Curtain ON');
                        }, ntime * 1000);
                    else if(th.id == 'curoff')
                        setTimeout(function(){
                            show('Curtain OFF');
                        }, ntime * 1000);
                    else if(th.id == "airon")
                        setTimeout(function(){
                            show('Air ON');
                        }, ntime * 1000);
                    else if(th.id == "airoff")
                        setTimeout(function(){
                            show('Air OFF');
                        }, ntime * 1000);
                    else if(th.id == "cookeron")
                        setTimeout(function(){
                            show('eCooker ON');
                        }, ntime * 1000);
                    else if(th.id == "cookeroff")
                        setTimeout(function(){
                            show('eCooker OFF');
                        }, ntime * 1000);
                }
                socket.emit('receive_submit', 'submit successful');
                console.log('back answer');
            }
            else
                console.log(err);
        });
        db.close();
    });
  
    //Attach a 'disconnect' event handler to the socket
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
});

function show(l1Text){
    var lcd = require('jsupm_i2clcd');
    var display = new lcd.Jhd1313m1(0, 0x3E, 0x62);
    display.setCursor(0, 0);
    display.write(l1Text);
}

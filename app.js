/**
 * @fileOverview 微信小程序的入口文件
 */
var event = require('./utils/event.js')
var qcloud = require('./vendor/qcloud-weapp-client-sdk/index');
var config = require('./config');
var util = require('./utils/util.js')
var showSuccess = text => wx.showToast({
    title: text,
    icon: 'success'
});

var showBusy = text => wx.showToast({
    title: text,
    icon: 'loading',
    duration: 10000
});

var showModel = (title, content) => {
    wx.hideToast();
    wx.showModal({
        title,
        content: JSON.stringify(content),
        showCancel: false
    });
};


var user = {};
App({
    /**
     * 小程序初始化时执行，我们初始化客户端的登录地址，以支持所有的会话操作
     */
    onLaunch() {
        if(this.globalData.userInfo == null){
            this.login()
            console.log("this.login()")
        }

        if(this.globalData.userData == null){
            console.log('this.getUser()')
            //this.getUser()
        }
        else{
            console.log('this.getUser() has something',this.globalData.userData)
        }

       /* event.on("addNewGroup",this,function(openId){
            this.getGroupNumber(openId)
            //还缺少一个获得群资料的接口
        })
        */
    },
    onShow(){
        if (this.globalData.tunnel) {
            if (this.globalData.tunnel.isClosed()) {
                this.globalData.tunnel.open()
            }
        }
        
    },

    onHide(){
        
    },

    login:function(){
        qcloud.setLoginUrl(config.service.loginUrl);
        var that = this;
        //var login = true
        //this.globalData.login = login
        qcloud.login({
            success(result) {
                //showSuccess('登录成功');
                console.log('login', result);
                that.globalData.userInfo = result;
                if (that.globalData.userData == null) {
                    that.getUser()
                }
            },
            fail(error) {
                showModel('登录失败', error);
            },
        });
    },

     getUser:function(){
        var that = this
         qcloud.request({
            url: `https://${config.service.host}/user`,
            login: true,
            success: (response) => {
                console.log('getUser',response)
                that.globalData.userData = response.data.data.userInfo
                that.globalData.myId = response.data.data.userInfo.openId
                console.log('myId',that.globalData.myId)
                if(that.globalData.tunnel == null){
                  that.openTunel()
                }
              /* if (that.globalData.groupsInfo.length == 0) {
                    that.getGroupId()
                }
                */
                if (that.globalData.friends.length == 0) {
                    that.requestFriends()
                }

                
            }
        });
    },

    requestFriends:function(){
        var that = this
        var url = `https://${config.service.host}/friend/list/`+this.globalData.myId
        qcloud.request({
            url:url,
            login: true,
            success: (response) => {
                    console.log('requestFriendsresponse',response)
                    var list = response.data.data.list
                    for (var i = 0; i < list.length; i++) {
                        list[i].messages = list[i].newMessages
                        console.log("list[i].newMessages",list[i].newMessages)
                    }
                    that.globalData.friends = list;
                    console.log('requestFriends',that.globalData.friends) //接口无
                    event.emit('getFriendsList',response.data.data.list)
                }
        })
    },

   /* getGroupId: function(){
        var that = this
        var url = `https://${config.service.host}/group/list/`+this.globalData.myId
        qcloud.request({
             url:url,
             success: (response) => {
                console.log('response',response)
                var data = response.data.data.list 
                console.log('getGroupId',data)
                that.globalData.groupsInfo = data
                event.emit('getGroupId',data)
                for(var i=0;i<data.length;i++)
                {
                    that.getGroupNumber(data[i].openId)
                }
                    
                },

            fail:(error)=> {
                console.log('dead')
                console.log(error)    
            },
            complete:()=> {
                console.log('执行了')
                //that.requestFriends()
            }
        })
    },

    getGroupNumber:function(groupId){
        var that = this
        var url = `https://${config.service.host}/group/member/`+ groupId
        qcloud.request({
             url:url,
             success: (response) => {
                console.log('...............',groupId)
                var groupList = {
                    'openId':groupId,
                    'list':response.data.data.list
                }
                that.globalData.groupMember.unshift(groupList)
                console.log('getGroupNumber',groupList)
                event.emit('getGroupNumber',groupList)
                },

            fail:(error)=> {
                console.log(error)    
            }
        })
    },
    */
    openTunel:function(){
        var that = this;
        var tunnel= new qcloud.Tunnel(config.service.tunnelUrl);

        tunnel.open();
        that.globalData.tunnel = tunnel
        console.log("tunnel.open();",tunnel)
        //event.emit('openTunel',tunnel)
        tunnel.on('online',online => {
            if(online.targetType == "friend" && online.targetId == that.globalData.myId){
               // event.emit('openTunel',tunnel)
            }
            else if(online.targetType == "group"){
                event.emit('groupNumberOnline',online)
            }

        })

        tunnel.on('offline',offline => {
            if(offline.targetType == "group"){
                 event.emit('groupNumberOffline',offline.data)
                 var groupMember = that.globalData.groupMember
                 for (var i = 0; i < groupMember.length; i++) {
                     if (groupMember[i].openId == offline.data.sourceId) {
                        groupMember.splice(i,1)
                     } 
                 }
            }
            
        })

        tunnel.on('add',add => {
            if(add.targetType == "friend" && add.targetId == that.globalData.myId){
                 event.emit('addFriend',add.data)
            }else if(add.targetType == "group"){
                 
                 var on = false
                 if (add.data.openId != that.globalData.myId) {
                    for (var i = 0; i < that.globalData.groupMember.length; i++) {
                        if (add.data.openId == that.globalData.groupMember[i].openId) {
                            on = true
                        }
                    }
                    if (on == false) {
                        that.globalData.groupMember.push(add.data)
                        event.emit('addGroup',add)
                    }
                    

                 }
            }
        })
        tunnel.on('ready',function(){
            event.emit('ready',tunnel)
            console.log("sdfdasdfasdfas",tunnel)
        })
        
        tunnel.on('delete',delete1 => {
             if(delete1.targetType == "friend" && delete1.targetId == that.globalData.myId){
                 event.emit('deleteFriend',delete1.data)
            }else if(add.targetType == "group"){
                 event.emit('deleteGroupNumber',delete1)
            }
        })

        tunnel.on('add2',add2 => {
            if(add2.targetType == "friend"){
                event.emit("add2Friend",add2.data)
            }else if(add2.targetType == "group"){
                add2.nearestMessage = {}
                add2.newMessages = []
                add2.messages = []
                add2.nickName = add2.groupName
                add2.type = "group"
                add2.lastTime = util.getTime(Date.now())
                that.globalData.groupsInfo = add2
                event.emit('add2Group',add2)
                that.globalData.groupMember = add2.member
            }
            
        })

        // 监听自定义消息（服务器进行推送）
        tunnel.on('speak', speak => {
            console.log('APP init收到说话消息：', speak);
            if(speak.targetType == "friend" && speak.targetId == that.globalData.myId){
                that.globalData.friendsMessages.push(speak)
                var friends = that.globalData.friends
                event.emit('friendMessage',speak)
                var has = false
                for (var i = 0; i < friends.length; i++) {
                    if (friends[i].openId == speak.data.sourceId) {
                        has = true
                        friends[i].messages.push(speak.data)
                        friends[i].nearestMessage = speak.data
                        friends[i].lastTime = util.getTime(speak.data.date)
                        if (speak.data.sourceId != that.globalData.enterOpenId) {
                            friends[i].newMessages.push(speak.data)
                        }
                    }
                }
                if (has == false) {
                    var onhas = false
                    var stranger = that.globalData.stranger
                    //console.log()
                    for (var i = 0; i < stranger.length; i++) {
                        if(stranger[i].openId == speak.data.sourceId){
                            onhas = true
                            stranger[i].lastTime = util.getTime(speak.data.date)
                            stranger[i].nearestMessage = speak.data
                            stranger[i].messages.push(speak.data)
                            if (speak.data.sourceId != that.globalData.enterOpenId) {
                                stranger[i].newMessages.push(speak.data)
                            }
                            console.log("friendMessage stranger",speak)
                        }
                    }
                    if (onhas == false) {
                        var strangerPerson = {
                            avatarUrl:speak.data.avatarUrl,
                            nickName:speak.data.sourceName,
                            openId:speak.data.sourceId,
                            type:"stranger",
                            messages:[speak.data],
                            nearestMessage:speak.data,
                            newMessages:[speak.data],
                            lastTime:util.getTime(speak.data.date)
                        }
                        that.globalData.stranger.unshift(strangerPerson)
                        console.log('addStranger')
                        event.emit('addStranger',strangerPerson)

                    }
                }
            }
            else if (speak.targetType == "friend" && speak.data.sourceId == that.globalData.myId) {
                var friends = that.globalData.friends
                var stranger = that.globalData.stranger
                event.emit('myMessage',speak)
                console.log('myMessage',speak)
                console.log('friends',friends)
                console.log('stranger',stranger)
                var has = false
                for (var i = 0; i < friends.length; i++) {
                    if (friends[i].openId == speak.targetId) {
                        console.log('friend friend friend',speak)
                        has = true
                        friends[i].messages.push(speak.data)
                        friends[i].nearestMessage = speak.data
                        friends[i].lastTime = util.getTime(speak.data.date)
                        if (speak.targetId != that.globalData.enterOpenId) {
                            friends[i].newMessages.push(speak.data)
                        }
                    }
                }
                for (var i = 0; i < stranger.length; i++) {
                    if (stranger[i].openId == speak.targetId) {
                        console.log('stranger stranger messages',speak)
                        has = true
                        stranger[i].messages.push(speak.data)
                        stranger[i].nearestMessage = speak.data
                        stranger[i].lastTime = util.getTime(speak.data.date)
                        if (speak.targetId != that.globalData.enterOpenId) {
                            stranger[i].newMessages.push(speak.data)
                        }
                    } 
                }
                if (has == false) {
                    var groupMember = that.globalData.groupMember
                    for (var i = 0; i < groupMember.length; i++) {
                        if (groupMember[i].openId == speak.targetId) {
                            var strangerPerson = {
                                avatarUrl:groupMember[i].avatarUrl,
                                nickName:groupMember[i].nickName,
                                openId:groupMember[i].openId,
                                type:"stranger",
                                messages:[speak.data],
                                nearestMessage:speak.data,
                                newMessages:[speak.data],
                                lastTime:util.getTime(speak.data.date)
                        }
                        that.globalData.stranger.unshift(strangerPerson)
                        } groupMember[i]
                    }
                   
                }

            }
            else if(speak.targetType == "group"){
                that.globalData.groupsInfo.nearestMessage = speak.data
                that.globalData.groupsInfo.lastTime = util.getTime(speak.data.date)
                that.globalData.groupsInfo.messages.push(speak.data)
                if (speak.targetId != that.globalData.enterOpenId) {
                    that.globalData.groupsInfo.newMessages.push(speak.data)
                }
                
                //that.globalData.groupMessage.push(speak)
                event.emit('groupMessage',speak)
            }
           

            //that.globalData.messages.push(speak)
           
            
        });

        // 打开信道
    },

    getUserInfo:function(arg){
        var that = this;
        if(this.globalData.userInfo){
            typeof arg=="function" && arg(this.globalData.userInfo)
        }else{
            qcloud.login({
                success(result) {
                   // showSuccess('登录成功');
                    console.log('登录成功', result);
                    
                    that.globalData.userInfo = result;
                    if(that.globalData.userData == null)
                        {
                            that.getUser()
                            console.log('that.getUser() 继续执行下去了', that.getUser())
                        }

                    typeof arg=="function" && arg(that.globalData.userInfo)
            },
            fail(error) {
                showModel('登录失败', error);
                console.log('登录失败', error);
            },
        });
        }
    },
    
    globalData:{
        login:false,
        userInfo:null,
        myId:null,
        friendsMessages:[],
        groupMessage:[],
        friends:[],  //openId  nickName  avatarUrl gender... nearestMessage{} newMessages[]
        stranger:[],
        tunnel:null,
        userData:null,
        groupsInfo:null, //openId groupName groupSign avatarUrl nearestMessage newMessages
        groupStorys:null, //还未获得
        groupMember:[],
       //inGroup:false
       // enterGroupId:null
       enterOpenId:null,
       imageList:[],
    }
});
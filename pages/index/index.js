
var event = require('../../utils/event.js')
// 引入 QCloud 小程序增强 SDK
var qcloud = require('../../vendor/qcloud-weapp-client-sdk/index');
var util = require('../../utils/util.js')
// 引入配置
var config = require('../../config');

// 显示成功提示
var showSuccess = text => wx.showToast({
    title: text,
    icon: 'success'
});

// 显示失败提示
var showModel = (title, content) => {
    wx.hideToast();
    wx.showModal({
        title,
        content: JSON.stringify(content),
        showCancel: false
    });
};       

/**
 * 使用 Page 初始化页面，具体可参考微信公众平台上的文档
 */
var appInstance = getApp();

Page({

    /**
     * 初始数据，我们把服务地址显示在页面上
     */
    data: {
        list:[],
        messages:[],
        friendsInfo:[],
        friendsMessasges:[],
        groupMessage:[],
        userInfo:{},
        loginUrl: config.service.loginUrl,
        requestUrl: config.service.requestUrl,
        groupList:[],
        verifyList:[],
        groupInfo:null,
    },

    onLoad:function(options){
        var that = this
        console.log("index/onLoad  我么次都会打开")
        if(appInstance.globalData.userInfo == null){
            //appInstance.globalData.userInfo == null 前判断关系
            appInstance.getUserInfo(function(userInfo){
                that.setData({
                    userInfo:userInfo
                })
            })
        }else{
            that.setData({
                    userInfo:appInstance.globalData.userInfo
                })
        }

        if (appInstance.globalData.tunnel != null) {
            this.tunnel = appInstance.globalData.tunnel
        }

        event.on('openTunel',this,function(tunnel){
            this.tunnel = tunnel
        })

        event.on('getFriendsList',this,function(list){
            var friendsInfo = that.data.friendsInfo
            var time, hour, minute
                 for (var i = 0; i < list.length; i++) {
                    if (list[i]) {
                        if (list[i].nearestMessage) {
                            time = list[i].nearestMessage.date
                        }else{
                            time = Date.now()
                        }
                        list[i].lastTime = util.getTime(time)//添加lastTime 和 messages 字段
                        list[i].messages = list[i].newMessages
                        list[i].type = "friend"          
                        friendsInfo.push(list[i])
                        console.log('list[i].messages',list[i].messages)
                    }
                }
                that.setData({
                    friendsInfo
                })
           
           /* console.log("friendsInfo",friendsInfo)
            for (var i = 0; i < that.data.friendsInfo.length; i++) {
                console.log("friendsInfoOpenId",that.data.friendsInfo[i].openId)
            }
            */
        })

        event.on('addGroup',this,function(group){
           // var friendsInfo = that.data.friendsInfo
            //将群信息放入列表
            //var 
        })

        event.on('getGroupId',this,function(group){
            /*var openId = group.groupId
            var nickName = group.groupName
            var avatarUrl = 'http://wx.qlogo.cn/mmopen/vi_32/TDj3GsR0VeYgXeC7JOJ0cHX0MmyTMu4kv843ZSJjo0XCUpT66aPlyydA5K7iaFbzRKmz3xLnxo2sEfdQ25KQp0g/0'
            //设置群昵称和头像
            */
            var friendsInfo = that.data.friendsInfo  
            var time, hour, minute
            for (var i = 0; i < group.length; i++) {
                time = group[i].nearestMessage.date
               // hour = parseInt(time%1000000/10000) 
              //  minute = parseInt(time%10000/100)
                group[i].lastTime = util.getTime(time)
                group[i].messages = group[i].newMessages
                group[i].type = "group"
                group[i].nickName = group[i].groupName
                friendsInfo.unshift(group[i])
            }
            
           /* friendsInfo.unshift({
                'openId':openId,
                'nickName':nickName,
                'avatarUrl':avatarUrl,
            })
            */
            that.setData({
                friendsInfo
            })
            console.log("添加了群了呀大兄弟",that.data.friendsInfo)
            //需要切换成friend
        })

        event.on('getGroupNumber',this,function(groupList1){
            //获得群成员
            var groupList = that.data.groupList
            groupList.push(groupList1)
            that.setData({
                groupList
            })
        })

        event.on('addFriend',this,function(friend){
            //添加好友 确认还未处理先添加进来
            //需要维护一个好友列表，不然所有的人都是一样的呢
            var verifyList = that.data.verifyList
            var has = false
            console.log('friend',friend)
            for (var i = 0; i < verifyList.length; i++) {
                if (verifyList[i].openId == friend.openId) {
                    has = true
                    break
                } 
            }
            if (has == false) {
                verifyList.unshift(friend)
                that.setData({
                    verifyList
                })
            }
            
        })

        event.on('deleteFriend',this,function(friend){
            //被删除了
            var length = that.data.friendsInfo.length
            var friendsInfo = that.data.friendsInfo
            for(var i=0;i<length;i++){
                if(friendsInfo[i].openId == friend.sourceId){
                    friendsInfo.splice(i,1)
                }
            }
            that.setData({
                friendsInfo
            })
        })
        event.on('deleteStranger',this,function(stranger){
            //删除对方
            var friendsInfo = that.data.friendsInfo
            for (var i = 0; i < friendsInfo.length; i++) {
                if(friendsInfo[i].openId == stranger){
                   friendsInfo.splice(i,1)
                }
            }
            that.setData({
                friendsInfo
            })
        })

        event.on('chatMessageUpdate',this,function(){
            //当前页面更新聊天数据
        })

        event.on('chatStranger',this,function(stranger){
            //主动和对方聊天
            var friendsInfo = that.data.friendsInfo
            var has = false
            for (var i = 0; i < friendsInfo.length; i++) {
                if (friendsInfo[i].openId == stranger.openId) {
                    has = true
                } 
            }
            if (has == false) {
                var stranger1 = stranger
                stranger1.nearestMessage = {}
                stranger1.newMessages = []
                stranger1.messages = []
                stranger1.type = "stranger"
                friendsInfo.unshift(stranger1)
                that.setData({
                    friendsInfo
                })
            }
           
        })

       // event.on 显示添加好友
       //未作删除群
        event.on('add2Group',this,function(add2){
            var groupsInfo = that.data.groupInfo
            if (add2 != groupsInfo) {
                var friendsInfo = that.data.friendsInfo
                add2.newMessages = []
                add2.nearestMessage = null
                add2.type = "group"
                add2.lastTime = util.getTime(Date.now())
                add2.nickName = add2.groupName
                groupsInfo = add2
                friendsInfo.unshift(groupsInfo)

                that.setData({
                    groupsInfo,
                    friendsInfo
                })
            }
            
        })

        event.on('friendMessage',this,function(friendMessage){
            //好友消息
            var friendsList = that.data.friendsInfo
            var sourceId = friendMessage.data.sourceId
            for(var i=0; i<friendsList.length;i++){
                    if(sourceId == friendsList[i].openId){
                        console.log("终于等到你")
                        friendsList[i].messages.push(friendMessage.data) 
                        friendsList[i].nearestMessage = friendMessage.data
                        friendsList[i].lastTime = util.getTime(friendMessage.data.date)
                        console.log("riendsList[i].nearestMessage",friendMessage.data)
                        if (friendMessage.targetId != appInstance.globalData.enterOpenId 
                            && friendMessage.data.sourceId != appInstance.globalData.enterOpenId) {
                            friendsList[i].newMessages.push(friendMessage.data)
                            console.log("pushmessage",friendsList[i].newMessages)    
                        }
                        //时间处理
                        console.log('friendMessage zhixingle ')
                        var temp = friendsList[i]
                        friendsList.splice(i,1)
                        friendsList.unshift(temp)
                        console.log("friendsListfriendsListfriendsList",friendsList)
                        that.setData({
                            friendsInfo:friendsList //可能需要添加
                        })
                    }
            }
        })

        event.on('myMessage',this,function(myMessage){
            var friendsList = that.data.friendsInfo
            var targetId = myMessage.targetId
            console.log("我自己的数据")
            for(var i=0; i<friendsList.length;i++){
                    if(targetId == friendsList[i].openId){
                        console.log("终于等到你!!!!!!!")
                        friendsList[i].messages.push(myMessage.data) 
                        friendsList[i].nearestMessage = myMessage.data
                        friendsList[i].lastTime = util.getTime(myMessage.data.date)
                        console.log("riendsList[i].nearestMessage",myMessage.data)
                        if (myMessage.targetId != appInstance.globalData.enterOpenId ) {
                            friendsList[i].newMessages.push(myMessage.data)
                            console.log("pushmessage",friendsList[i].newMessages)    
                        }
                        //时间处理

                        var temp = friendsList[i]
                        friendsList.splice(i,1)
                        friendsList.unshift(temp)
                        console.log("friendsListfriendsListfriendsList",friendsList)
                        that.setData({
                            friendsInfo:friendsList //可能需要添加
                        })
                    }
            }
        })

        event.on('groupMessage',this,function(groupMessage){
            //群消息
           var friendsList = that.data.friendsInfo
            var targetId = groupMessage.targetId
            for(var i=0; i<friendsList.length;i++){
                    if(targetId == friendsList[i].openId){
                        
                        //console.log('friendsList[i].newMessages',friendsList[i].newMessages)                        
                        friendsList[i].nearestMessage = groupMessage.data
                        friendsList[i].lastTime = util.getTime(groupMessage.data.date)
                        if (groupMessage.targetId != appInstance.globalData.enterOpenId 
                            && groupMessage.data.sourceId != appInstance.globalData.enterOpenId) {
                            friendsList[i].newMessages.push(groupMessage.data)   
                        }
                        //时间处理
                        var temp = friendsList[i]
                        friendsList.splice(i,1)
                        friendsList.unshift(temp)
                        console.log("friendsList   friendsList",friendsList)
                        that.setData({
                            friendsInfo:friendsList//可能需要添加
                        })
                    }
            }
            
            
        })
    
        event.on('enterGroup',this,function(openId){
            var friendsInfo = that.data.friendsInfo
            for (var i = 0; i < friendsInfo.length; i++) {
                if (friendsInfo[i].openId == openId) {
                    friendsInfo[i].newMessages = []
                    console.log("friendsInfo[i].newMessages",friendsInfo[i].newMessages)
                }
            }
            that.setData({
                friendsInfo
            })
        })

        event.on('enterPersonalChat',this,function(openId){
            var friendsInfo = that.data.friendsInfo
            for (var i = 0; i < friendsInfo.length; i++) {
                if (friendsInfo[i].openId == openId) {
                    friendsInfo[i].newMessages = []
                    console.log("friendsInfo[i].newMessages",friendsInfo[i].newMessages)
                }
            }
            that.setData({
                friendsInfo
            })
        })
        event.on('addStranger',this,function(stranger){
            console.log("addStranger",stranger)
            var friendsInfo = that.data.friendsInfo
            friendsInfo.unshift(stranger)
            console.log('addStranger zhixingle ')
            this.setData({
                friendsInfo
            })
            console.log(friendsInfo)
        })

        if (this.data.friendsInfo.length == 0 && appInstance.globalData.groupsInfo) {
            var friendsInfo = this.data.friendsInfo
            var group = appInstance.globalData.groupsInfo
           // var time, hour, minute
           /* for (var i = 0; i < group.length; i++) {
                //time = group[i].nearestMessage.date
                //hour = parseInt(time%1000000/10000) 
                //minute = parseInt(time%10000/100)
                group[i].lastTime = 
                group[i].messages = group[i].newMessages
                group[i].type = "group"
                group[i].nickName = group[i].groupName
                friendsInfo.unshift(group[i])
            }
            that.setData({
                friendsInfo
            })
            */
        }

        if (this.data.friendsInfo.length == 0) {
            var friendsInfo = that.data.friendsInfo
            var list = appInstance.globalData.friends
            var stranger = appInstance.globalData.stranger
            var time
           // var time, hour, minute
            for (var i = 0; i < list.length; i++) {
                if (list[i].nearestMessage) {
                    time = list[i].nearestMessage.date
                    list[i].lastTime = util.getTime(time)
                }else{
                     list[i].lastTime = util.getTime(Date.now())
                }
               
             //   hour = parseInt(time%1000000/10000) 
             //  minute = parseInt(time%10000/100)
                //添加lastTime 和 messages 字段
                list[i].messages = list[i].newMessages
                list[i].type = "friend"          
                friendsInfo.push(list[i])

            }
            for (var i = 0; i < stranger.length; i++) {
                friendsInfo.unshift(stranger[i])
            }
            
            console.log('stranger',stranger)
            console.log('friendsInfo',friendsInfo)
            that.setData({
                friendsInfo
            })
        }

        if (this.data.groupList.length == 0 && appInstance.globalData.groupMember.length != 0) {
            var groupList = this.data.groupList
            var groupList1 = appInstance.globalData.groupMember
            groupList.push(groupList1)
            that.setData({
                groupList
            })
        }
        if (appInstance.globalData.groupsInfo != that.data.groupInfo) {
            var groupsInfo = that.data.groupInfo
            var friendsInfo = that.data.friendsInfo
            groupsInfo = appInstance.globalData.groupsInfo
            friendsInfo.unshift(groupsInfo)
            that.setData({
                groupsInfo,
                friendsInfo
            })
        }

    },
    onUnload:function(){
        event.remove('openTunel',this);
        event.remove('getFriendsList',this);
        event.remove('getGroupId',this);
        event.remove('getGroupNumber',this);
        event.remove('addFriend',this);
        event.remove('deleteFriend',this);
        event.remove('friendMessage',this);
        event.remove('groupMessage',this);
        event.remove('add2Group',this);
        event.remove('enterGroup',this);
        event.remove('enterPersonalChat',this);
        event.remove('deleteStranger',this);
        event.remove('chatStranger',this);
        event.remove('addStranger',this);
        //this.tunnel.close()
    },

    refuse(args){
        var openId = args.currentTarget.dataset.openId
        var verifyList = this.data.verifyList
        if (verifyList.length > 0) {
            for (var i = 0; i < verifyList.length; i++) {
                if(verifyList[i].openId == openId){
                    verifyList.splice(i,1)
                }
            }
            this.setData({
                verifyList
            })
        }
    },

    accept(args){
        var openId = args.currentTarget.dataset.openId
        var verifyList = this.data.verifyList
        var sourceId = appInstance.globalData.userData.openId
        var sourceName = appInstance.globalData.userData.nickName
        var avatarUrl = appInstance.globalData.userData.avatarUrl
        var friendsInfo = this.data.friendsInfo
        var addPersonInfo = null
        var has = false
        console.log(this.tunnel)
        this.tunnel.emit('add2',{
           "targetType":"friend",
            "targetId":openId,
            "data":{
                "sourceId":sourceId,
                "sourceName":sourceName,
                "avatarUrl":avatarUrl,
                "result":true
                }
            })
        if (verifyList.length > 0) {
            for (var i = 0; i < verifyList.length; i++) {
                if(verifyList[i].openId == openId){
                    addPersonInfo = verifyList[i]
                    verifyList.splice(i,1)
                }
            }
            this.setData({
                verifyList
            })
        }
        for (var i = 0; i < friendsInfo.length; i++) {
            if (friendsInfo[i].openId == openId) {
                has = true
                friendsInfo[i].type = "friend"
                var temp = friendsInfo[i]
                friendsInfo.splice(i,1)
                friendsInfo.unshift(temp)
                appInstance.globalData.friends.unshift(temp)
                this.setData({
                    friendsInfo
                })
            }

        }
        if (!has) {
            addPersonInfo.nearestMessage = {}
            addPersonInfo.newMessages = []
            addPersonInfo.messages = []
            addPersonInfo.type = "friend"
            friendsInfo.unshift(addPersonInfo)
            appInstance.globalData.friends.unshift(addPersonInfo)
            this.setData({
                friendsInfo
            })
        }



    },

   
    /**
     * 点击「聊天室」按钮，跳转到聊天室综合 Demo 的页面
     */
    openChat(args) {
        console.log("friendsInfo",this.data.friendsInfo)
        var openId = args.currentTarget.dataset.openId
        var type = args.currentTarget.dataset.type
        console.log("openIdOpenChat",openId)
        console.log("util.formatTime",Date.now())
        if (type == "group") {
            var url = '../chat/chat?openId='+openId
             wx.navigateTo({
                url: url,
                success: function(res){

                }
            })
             event.emit('enterGroup',openId)
        }
        else if (type == "friend" || type == "stranger") {
            var url = '../personalChat/personalChat?openId='+openId +'&type='+type
            wx.navigateTo({
                url: url,
                success: function(res){
                    event.emit('enterPersonalChat',openId)
                }
            })
        }

        /*var nickName = args.currentTarget.dataset.nickName
        var id = args.currentTarget.dataset.id
        var avatarUrl = args.currentTarget.dataset.avatarUrl
        var isFriend = true
        var url = "../personalChat/personalChat?nickName="+nickName+"&id="+id+"&avatarUrl="+avatarUrl+"&isFriend="+isFriend
        wx.navigateTo({ url: url});
        */
    },

    openGoupChat(args){

        wx.navigateTo({
          url: '../chat/chat',
          success: function(res){
              appInstance.globalData.enterGroupId = args.openId //传入ID
          }
        })
    },

    note(args){
        wx.navigateTo({
          url: '../notes/notes',
          success: function(res){
            // success
          },
        })
    },
    onPullDownRefresh: function(){
        wx.stopPullDownRefresh()
    } 
});

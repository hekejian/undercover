
// 引入 QCloud 小程序增强 SDK
var event = require('../../utils/event.js')
var qcloud = require('../../vendor/qcloud-weapp-client-sdk/index');

// 引入配置
var config = require('../../config');
var util = require('../../utils/util.js')
/**
 * 生成一条聊天室的消息的唯一 ID
 */
var showSuccess = text => wx.showToast({
    title: text,
    icon: 'success'
});



function msgUuid() {
    if (!msgUuid.next) {
        msgUuid.next = 0;
    }
    return 'msg-' + (++msgUuid.next);
}
function createSystemMessage(content) {
    return { id: msgUuid(), type: 'system', content };
}

/**
 * 生成聊天室的聊天消息
 */
function createUserMessage(content, user, isMe) {
    return { id: msgUuid(), type: 'speak', content, user, isMe };
}

var hasDelete = false
var appInstance = getApp();
Page({
    data:{
         messages: [],
         friendInfo:null,
         lastMessageId:'none',
         inputContent: '美女，你坐在我前面，好漂亮啊',
         type:null
    },

    onLoad(options){
        console.log(options)
        var that = this
        var openId = options.openId
        console.log("options.openId",options.openId)
        appInstance.globalData.enterOpenId = openId
        var friends = appInstance.globalData.friends
        appInstance.globalData.enterOpenId = openId
        console.log("friendsfriendsfriendsfriendsfriends",friends)
        var friendInfo = null
        if (options.type == "friend") {
            console.log("friend")
            for (var i = 0; i < friends.length; i++) {
                if (friends[i].openId == openId) {
                    friendInfo = friends[i]
                    friendInfo.type = "friend"
                    that.setData({
                        friendInfo
                    })
                    console.log('friendInfo.type',this.data.friendInfo.type)
                }
            }
            that.setData({
                type:"friend"
            })
            //终究要修改
        }

        if (options.type == "stranger") {
            var groupMember = appInstance.globalData.groupMember
            var stranger = appInstance.globalData.stranger
            console.log('appInstance.globalData.groupMember',appInstance.globalData.groupMember)
            var has = false
            console.log('stranger',stranger)
            console.log('groupMember',groupMember)
            console.log('openId',openId)
            for (var i = 0; i < stranger.length; i++) {
                if (stranger[i].openId == openId) {
                    has = true
                    friendInfo = stranger[i]
                    event.emit('chatStranger',friendInfo)
                    that.setData({
                        friendInfo
                    })
                    console.log(that.data.friendInfo)
                } 
            }
            if (has == false) {
                for (var i = 0; i < groupMember.length; i++) {
                    if (groupMember[i].openId == openId) {
                        friendInfo = groupMember[i]
                        friendInfo.type = "stranger"
                        event.emit('chatStranger',friendInfo)
                        that.setData({
                            friendInfo
                        })
                        console.log('friendInfo.type',this.data.friendInfo.type)
                    }
               
                }
            }
            
            /*for (var i = 0; i < groupMember.length; i++) {
                for (var j = 0; j < groupMember[i].list.length; j++) {
                    if (groupMember[i].list[j].openId == openId) {
                        friendInfo = groupMember[i].list[j]
                        friendInfo.type = "stranger"
                        event.emit('chatStranger',friendInfo)
                        that.setData({
                            friendInfo
                        })
                    }

                }
            }
            */
            that.setData({
                type:"stranger"
            })
            
        }
        if (openId == appInstance.globalData.myId) {
            var friendInfo = appInstance.globalData.userData
            that.setData({
                friendInfo
            })
            console.log("friendInfofriendInfofriendInfo",friendInfo)
        }
        
        //this.showVerifyInfo()
        this.tunnel = appInstance.globalData.tunnel
        this.me = appInstance.globalData.userData

        event.on('openTunel',this,function(tunnel){
           this.tunnel = tunnel
        })

        event.on('addFriend',this,function(add){
           //添加好友可能需要 当聊天对方向你添加时
           var friendInfo = this.data.friendInfo
           console.log('add',add)
           if (add.openId == friendInfo.openId) {
                this.showVerifyInfo(add.openId)
            }  
        })

        event.on('deleteFriend',this,function(delete1){
           //当对方删除你时
           if (delete1.sourceId == friendInfo.openId) {
                hasDelete = true
           }
           
        })

        event.on('friendMessage',this,function(speak){
           //双方说话时
            console.log('speak.data.sourceId',speak.data.sourceId)
            console.log('friendInfo.openId',friendInfo.openId)
            if (speak.data.sourceId == friendInfo.openId) {
                var isMe = false
                var who = {
                    "nickName":speak.data.sourceName,
                    "avatarUrl":speak.data.avatarUrl,
                }

                that.pushMessage(createUserMessage(speak.data.content,who,isMe))
           }
        })

        event.on('myMessage',this,function(speak){
            if (speak.data.sourceId == appInstance.globalData.myId && speak.targetId == friendInfo.openId) {
                var isMe = true
                var who = {
                    "nickName":speak.data.sourceName,
                    "avatarUrl":speak.data.avatarUrl,
                }
               // that.pushMessage(createUserMessage(speak.data.content,who,isMe))  这是一种接收到后渲染的方式
            }   
        })
        event.on('add2Friend',this,function(add2Friend){
            var friendInfo = this.data.friendInfo
            if (add2Friend.sourceId == friendInfo.openId) {
                friendInfo.type = "friend"
                console.log("friendInfo",friendInfo)
                this.setData({
                    friendInfo
                })
                that.setData({
                    type:'friend'
                })
                that.pushMessage(createSystemMessage("你们已经是好友了"))
            }
        })
    },

    onUnload(){
        event.remove('openTunel',this);
        event.remove('addFriend',this);
        event.remove('deleteFriend',this);
        event.remove('friendMessage',this);
        event.remove('myMessage',this);
        event.remove('add2Friend',this);
    },

    onReady() {
        wx.setNavigationBarTitle({ title: this.data.friendInfo.nickName});
            var friendMessage = this.data.friendInfo.messages
            var isMe = false
            console.log("friendMessage",friendMessage)
            if (friendMessage) {
                for (var i = 0; i < friendMessage.length; i++) {
                    isMe = false
                    if (friendMessage[i].sourceId == appInstance.globalData.myId) {
                        isMe = true
                    }
                    var who = {
                        "nickName":friendMessage[i].sourceName,
                        "avatarUrl":friendMessage[i].avatarUrl,
                    }
                this.pushMessage(createUserMessage(friendMessage[i].content,who,isMe))
                }
            }
        
        
    },

    addfriend(){
        this.tunnel.emit('add',{
                    "targetType":"friend",
                    "targetId":this.data.friendInfo.openId,
                    "data":{}
                })
        showSuccess('消息已发送')
        event.emit('add',this.data.friendInfo.openId)
        //添加对方为好友
    },

    deletefriend(){
        this.tunnel.emit('delete',{
                    "targetType":"friend",
                    "targetId":this.data.friendInfo.openId,
                    "data":{}
                })
        event.emit('deleteStranger',this.data.friendInfo.openId)
        wx.switchTab({
            url:'../index/index'
        })
        //删除对方好友
    },
    showVerifyInfo(openId){
        var that = this
        if (appInstance.globalData.enterOpenId == openId) {
            wx.showModal({
            title:"对方请求添加好友",
            content: "  添加好友以后还可以继续愉快的聊天哦",
            showCancel: true,
            cancelText:"拒绝",
            cancelColor: '#6E6E6E',
            confirmText:"添加",
            confirmColor:"#6C5BB7",
            success: function(res){
                if (res.confirm) {
                    //确认添加
                    that.verifyFriend()
                    that.setData({
                        type:'friend'
                    })
                    //event.emit("addFriendToList",) 具体要传什么数据呢
                }
                else{
                    //拒绝添加
                }
            }
        });
        }
        
    },

    verifyFriend(){
        var sourceId = appInstance.globalData.userData.openId
        console.log("sfsfdas  sourceId",sourceId)
        var sourceName = appInstance.globalData.userData.nickName
        var avatarUrl = appInstance.globalData.userData.avatarUrl
        this.tunnel.emit('add2',{
                    "targetType":'friend',
                    "targetId":this.data.friendInfo.openId,
                    "data":{
                        "sourceId":sourceId,
                        "sourceName":sourceName,
                        "avatarUrl":avatarUrl,
                        "result":true
                    }
                })
        var stranger = appInstance.globalData.stranger
        var friends = appInstance.globalData.friends
        for (var i = 0; i < stranger.length; i++) {
            if (stranger[i].openId == this.data.friendInfo.openId) {
                var friend = stranger[i]
                friend.type = 'friend'
                stranger.splice(i,1)
                friends.unshift(friend)
                console.log('cao ni ma',friend);
                this.setData({
                    friendInfo:friend
                })
            } 
        }

        this.pushMessage(createSystemMessage('对方已经是你好友'))
    },

    updateMessages(updater) {
        var messages = this.data.messages;
        updater(messages);

        this.setData({ messages });

        // 需要先更新 messagess 数据后再设置滚动位置，否则不能生效
        var lastMessageId = messages.length ? messages[messages.length - 1].id : 'none';
        this.setData({ lastMessageId });
    },

    /**
     * 追加一条消息
     */
    pushMessage(message) {
        this.updateMessages(messages => messages.push(message));
    },

    /**
     * 替换上一条消息
     */
    amendMessage(message) {
        this.updateMessages(messages => messages.splice(-1, 1, message));
    },

    /**
     * 删除上一条消息
     */
    popMessage() {
        this.updateMessages(messages => messages.pop());
    },

    /**
     * 用户输入的内容改变之后
     */
    changeInputContent(e) {
        this.setData({ inputContent: e.detail.value });
    },

    onUnload(e){
        appInstance.globalData.enterOpenId = null
    },

    /**
     * 点击「发送」按钮，通过信道推送消息到服务器
     **/
    sendMessage(e) {
        // 信道当前不可用
        if (!this.tunnel || !this.tunnel.isActive()) {
            this.pushMessage(createSystemMessage('对不起你还未连接'));
            return;
        }
         if (hasDelete) {
            this.pushMessage(createSystemMessage('对不起对方已经将你删除，你不能向对方发消息'));
            return;
        }
        console.log("sendMessage")
        setTimeout(() => {
            if (this.data.inputContent && this.tunnel) {
                //this.tunnel.emit('speak', { word: this.data.inputContent });
                var isMe = true
                var who = {
                    "nickName":appInstance.globalData.userData.nickName,
                    "avatarUrl":appInstance.globalData.userData.avatarUrl,
                }
                this.pushMessage(createUserMessage(this.data.inputContent, who, isMe))
                var date = Date.now()
                console.log('this.tunnel',this.tunnel)
                this.tunnel.emit('speak',{
                    "targetType":'friend',
                    "targetId":this.data.friendInfo.openId,
                    "data":{
                        "sourceId":appInstance.globalData.myId,
                        "sourceName":appInstance.globalData.userInfo.nickName,
                        "avatarUrl":appInstance.globalData.userInfo.avatarUrl,
                        "date":date,
                        "content":this.data.inputContent
                    }
                })
                this.setData({ inputContent: '' });
            }
        });
    },
    
    back:function(){
        appInstance.globalData.enterOpenId = null
        var url = "../index/index"
        wx.switchTab({
            url:url
        })
    },
    onPullDownRefresh: function(){
        wx.stopPullDownRefresh()
    }  
})
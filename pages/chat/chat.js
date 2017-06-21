// 引入 QCloud 小程序增强 SDK
var event = require('../../utils/event.js')
var qcloud = require('../../vendor/qcloud-weapp-client-sdk/index');

// 引入配置
var config = require('../../config');

var util = require('../../utils/util.js')
/**
 * 生成一条聊天室的消息的唯一 ID
 */
function msgUuid() {
    if (!msgUuid.next) {
        msgUuid.next = 0;
    }
    return 'msg-' + (++msgUuid.next);
}

/**
 * 生成聊天室的系统消息
 */
function createSystemMessage(content) {
    return { id: msgUuid(), type: 'system', content };
}

/**
 * 生成聊天室的聊天消息
 */
function createUserMessage(content, user, isMe) {
    return { id: msgUuid(), type: 'speak', content, user, isMe };
}



var showModel = (title, content) => {
    wx.hideToast();
    wx.showModal({
        title,
        content: JSON.stringify(content),
        showCancel: false
    });
};

var appInstance = getApp()
var addgroup = false
// 声明聊天室页面
Page({

    /**
     * 聊天室使用到的数据，主要是消息集合以及当前输入框的文本
     */
    data: {
        groupInfo:null, // openId  groupName  groupSign avatarUrl nearestMessage newMessages
        messages: [],
        inputContent: '大家难得相遇，相聚就是缘啊',
        lastMessageId: 'none',
        scrollTop:99999,
        groupNumber:[], //list
        long:false,
        show:true,
        state:'等待中...',
        enter:3,
        total:6,
        enterNumber:3,
    },
   
    onLoad(options){
        console.log("chat/onLoad")
        var that = this
        addgroup = false
        var getInfo = false
        //var groupOpenId = options.openId
        var long  = this.long
        //var groupOpenId = options.openId
        var groupOpenId = '58afeeed834b87fc515f9f35'
        appInstance.globalData.enterOpenId = groupOpenId
        
        if (appInstance.globalData.groupsInfo) {
            if (appInstance.globalData.groupsInfo.openId == groupOpenId) {
                getInfo = true
                addgroup = true 
                var groupInfo = appInstance.globalData.groupsInfo
                var groupNumber = appInstance.globalData.groupMember
                if(groupNumber.length > 6){
                    long = true
                }

                that.setData({
                        groupInfo,
                        groupNumber,
                        long,
                       // groupMember
                       // messages : groupInfo.newMessages
                    })
            }
        }

        if (getInfo == false) {
            //加群
            console.log("this.addGroup(groupOpenId)")
           //this.addGroup(groupOpenId)
            console.log("没有加群")
            wx.showToast({
                title:'正在加入群聊',
                icon:"loading",
                duration:10000,
            })
        }
        if (appInstance.globalData.tunnel) {
            this.tunnel = appInstance.globalData.tunnel
            console.log('this.tunnel',this.tunnel)
        }else{
            //appInstance.login() //测试使用
            //appInstance.getUser()
            console.log('yiyi')
        }
        //this.tunnel = appInstance.globalData.tunnel
        this.me = appInstance.globalData.userData
        
       /* if(appInstance.globalData.inGroup == false){
            this.addGroup() //加群是什么鬼
        }
        */
        

        event.on('getGroupId',this,function(group){
            //设置群昵称和头像
            //设置不对，没做判断，获取groupId 的途径也不对
            for (var i = 0; i < group.length; i++) {
                if (group[i].openId == groupOpenId) {
                    that.setData({
                        groupInfo:group[i]
                    })
                }
                
            }
            
        })

        event.on('getGroupNumber',this,function(groupList){
            //获得群成员
            if(groupList.openId == groupOpenId){
                if(groupList.list.length > 6){
                    long = true
                }
                that.setData({
                    groupNumber:groupList.list,
                    long
                })
            }
        })

        event.on('ready',this,function(tunnel){
           this.tunnel = tunnel
           console.log("ready",tunnel)
           console.log("ready")
           if (addgroup == false) {
            console.log("groupOpenId")
            this.addGroup(groupOpenId)
           }
        })

        event.on('groupNumberOnline',this,function(online){

        })

        event.on('groupNumberOffline',this,function(offline){
            console.log('offline',offline)
            var groupNumber = that.data.groupNumber
            for (var i = 0; i < groupNumber.length; i++) {
                if(groupNumber[i].openId == offline.sourceId){
                    groupNumber.splice(i,1)
                    console.log('我删掉了',groupNumber)
                }
            }
            that.setData({
                groupNumber
            })
        })

        event.on('addGroup',this,function(add){
            if(add.targetId == groupOpenId && add.data.openId != appInstance.globalData.myId){
                var total = that.data.groupNumber.length + 1
                var groupNumber = that.data.groupNumber
                groupNumber.push(add.data)
                that.setData({
                    groupNumber
                })
                that.pushMessage(createSystemMessage(`${add.data.nickName}已加入群聊，共 ${total} 人`))
            }

            /*if(add.targetId == groupOpenId && add.data.openId == appInstance.globalData.myId){
                //event.emit('addNewGroup',groupOpenId) 这是什么意思
            }*/
        })
        event.on('copyNumber',this,function(){
            
        })

        event.on('add2Group',this,function(add2){
            wx.hideToast()
            var total = add2.member.length
            add2.newMessages = []
            add2.nearestMessage = null
            that.setData({
                groupInfo:add2,
                groupNumber:add2.member
            })
            that.pushMessage(createSystemMessage(`我已加入群聊，共 ${total} 人`))
            wx.setNavigationBarTitle({ title: this.data.groupInfo.groupName});
        })

        event.on('deleteGroupNumber',this,function(delete1){
            if(delete1.targetId == groupOpenId){
                if(delete1.data.sourceId != appInstance.globalData.myId){
                    var groupNumber = that.data.groupNumber
                    for(var i=0; i<groupNumber; i++){
                        if(groupNumber[i].openId == delete1.data.sourceId){
                            groupNumber.splice(i,1)
                            that.setData({
                                groupNumber 
                            })
                        }
                    }
                }
            }
        })

        event.on('groupMessage',this,function(speak){
            if(speak.targetId == groupOpenId){
                var speakData = speak.data //sourceId sourceName date content
                var isMe = false
                if(speakData.sourceId == appInstance.globalData.myId){
                      isMe = true
                }else{
                    var who = {
                    "nickName":speakData.sourceName,
                    "avatarUrl":speakData.avatarUrl,
                    }
                    that.pushMessage(createUserMessage(speakData.content,who,isMe))
                }
                
            }
            
        })

        
    }, 

    onUnload:function(){
        event.remove('getGroupId',this);
        event.remove('getGroupNumber',this);
        event.remove('openTunel',this);
        event.remove('groupNumberOnline',this);
        event.remove('groupNumberOffline',this);
        event.remove('addGroup',this);
        event.remove('add2Group',this);
        event.remove('deleteGroupNumber',this);
        event.remove('groupMessage',this);
    },
    //拉取群数据
    requsetFriends(url) {
            var that = this
        // qcloud.request() 方法和 wx.request() 方法使用是一致的，不过如果用户已经登录的情况下，会把用户的会话信息带给服务器，服务器可以跟踪用户
            qcloud.request({
            // 要请求的地址
            url: url,
            // 请求之前是否登陆，如果该项指定为 true，会在请求之前进行登录
            login: true,
            success(result) {
                console.log('request success', result);
                //appInstance.global.friends = result;
                that.setData({
                    list:result
                })
            },
            fail(error) {
                //showModel('加入讨论失败', error);
                console.log('request fail', error);
            },
        });
    },
    /**
     * 页面渲染完成后，启动聊天室
     * */
    onReady() {
        if (this.data.groupInfo != null) {
            wx.setNavigationBarTitle({ title: this.data.groupInfo.groupName});
            //渲染未读消息
            var groupMessage = this.data.groupInfo.messages
            var isMe = false
            //var avatarUrl = null
            //var groupNumber = this.data.groupNumber
            for (var i = 0; i < groupMessage.length; i++) {
                isMe = false
                console.log("groupMessage[i]",groupMessage[i])
                console.log(groupMessage[i].avatarUrl)
                if (groupMessage[i].sourceId == appInstance.globalData.myId) {
                    isMe = true
                    //avatarUrl = appInstance.globalData.userData.avatarUrl

                }
                /*else{
                    for (var j = 0; j < groupNumber.length; j++) {
                        if (groupNumber[j].openId == groupMessage[i].sourceId) {
                            avatarUrl = groupNumber[j].avatarUrl
                        }
                    
                    }
                }
                */
                //居然没有 groupMessage[i].sourceAvatar 字段

                var who = {
                        "nickName":groupMessage[i].sourceName,
                        "avatarUrl":groupMessage[i].avatarUrl,
                    // "avatarUrl":avatarUrl
                 }
                this.pushMessage(createUserMessage(groupMessage[i].content,who,isMe))
            }
        }
       
        
         //this.pushMessage(createSystemMessage('正在加入群聊...'));
        //this.tunnelListener()
        //this.requsetFriends("")
        // this.popMessage() //删除上一条消息
    },

    /**
     * 后续后台切换回前台的时候，也要重新启动聊天室
     */
    onShow() {
        //重新启动需要做什么吗？
         var groupNumber = this.data.groupNumber
            for(var i = 0; i<8; i++){
                groupNumber[i] = appInstance.globalData.groupMember[0]
            }
            this.setData({
                groupNumber
            })
    },

    addGroup(groupOpenId){
         setTimeout(() => {
            if (this.tunnel) {
                addgroup = true
                console.log("Date.now()")
                var date = Date.now()
                this.tunnel.emit('add',{
                    "targetType":"group",
                    "targetId":groupOpenId,
                    "data":{
                       
                    }
                    /*
                     "sourceId":appInstance.globalData.myId,
                        "sourceName":appInstance.globalData.userInfo.nickName,
                        "sourceAvatar":appInstance.globalData.userInfo.avatarUrl,
                        "date":1451692802008 业务服务器会注入
                    */
                })
            }
        });
    },
    

    /**
     * 通用更新当前消息集合的方法
     */
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

    /**
     * 点击「发送」按钮，通过信道推送消息到服务器
     **/
    sendMessage(e) {
        // 信道当前不可用
        console.log("!this.tunnel ",this.tunnel )
        if (!this.tunnel || !this.tunnel.isActive()) {
            this.pushMessage(createSystemMessage('您还没有加入群聊，请稍后重试'));
            if (this.tunnel.isClosed()) {
               console.log("信道还未打开")
            }
            return;
        }

        setTimeout(() => {
            if (this.data.inputContent && this.tunnel) {
                //this.tunnel.emit('speak', { word: this.data.inputContent });
                var isMe = true
                var who = {
                    "nickName":appInstance.globalData.userData.nickName,
                    "avatarUrl":appInstance.globalData.userData.avatarUrl,
                    }
                this.pushMessage(createUserMessage(this.data.inputContent,who,isMe))
                var date = Date.now()
                console.log(this.tunnel)
                this.tunnel.emit('speak',{
                    "targetType":"group",
                    "targetId":this.data.groupInfo.openId,
                    "data":{
                        "sourceId":appInstance.globalData.myId,
                        "sourceName":appInstance.globalData.userInfo.nickName,
                        "avatarUrl":appInstance.globalData.userInfo.avatarUrl,
                        "date":Date.now(),
                        "content":this.data.inputContent
                    }
                })
                this.setData({ inputContent: '' });
            }
        });
    },

    kindToggle: function () {
       var show = !this.data.show
       this.setData({
           show:show
       })
  },

    onUnload:function(){
        appInstance.globalData.enterOpenId = null
    },
    
    chatPerson:function(e){
        console.log(e)
        var openId = e.currentTarget.dataset.openId
        console.log("openIdopenIdopenIdopenId",openId)
        var friends =  appInstance.globalData.friends
        var type = "stranger"
        for (var i = 0; i <friends.length; i++) {
            if (friends[i]) {
                if (friends[i].openId == openId) {
                type = "friend"
                }
            }
              
        }
        var isFriend = false
        var url = '../personalChat/personalChat?openId='+openId +"&type="+type
        wx.navigateTo({ url: url});
    },

    chatPerson1: function(e){
        console.log(e)
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
});

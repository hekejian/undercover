var Session = require('../../vendor/qcloud-weapp-client-sdk/lib/session')
var constants = require('../../vendor/qcloud-weapp-client-sdk/lib/constants');
var sourceType = [ ['camera'], ['album'], ['camera', 'album'] ]
var sizeType = [ ['compressed'], ['original'], ['compressed', 'original'] ]
var videoSourceType = [ ['camera'], ['album'], ['camera', 'album'] ]
var camera = [ ['front'], ['back'], ['front', 'back'] ]
var duration = Array.apply(null, {length: 60}).map(function (n, i) {
  return i + 1
})
var util = require('../../utils/util.js')
var event = require('../../utils/event.js')
var qcloud = require('../../vendor/qcloud-weapp-client-sdk/index');
var config = require('../../config');

var playTimeInterval
var recordTimeInterval

var buildAuthHeader = function buildAuthHeader(session) {
    var header = {};

    if (session && session.id && session.skey) {
        header[constants.WX_HEADER_ID] = session.id;
        header[constants.WX_HEADER_SKEY] = session.skey;
    }

    return header;
};

var showAddGroup = function showAddGroup(){
  wx.showModal({
    title:'提示',
    content:'你还未加群，你所发表的故事需要依附在一个实体上，请扫码加入具体的群',
    showCancel:false,
    confirmText:"确定",
    confirmColor:'#6C5BB7',
    success:function(){

    }
  })
}
var appInstance = getApp()

Page({
     data: {
        text:"遇见美好",
        imageList: [],
        imageListCopy: [],
        groupInfo:null,
        countIndex: 8,
        count: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        sourceTypeIndex: 2,
        sizeTypeIndex: 2,
        videoSourceTypeIndex: 2,
        cameraIndex: 2,
        durationIndex: 59,
        duration: duration.map(function (t) { return t + '秒'}),
        src: '',
        recording: false,
        playing: false,
        hasRecord: false,
        recordTime: 0,
        playTime: 0,
        formatedRecordTime: '00:00:00',
        formatedPlayTime: '00:00:00',

        
  },

  onLoad: function(){
    var that = this
    if (!appInstance.globalData.groupsInfo) {
      showAddGroup()
    }
    else{
      var groupInfo = appInstance.globalData.groupsInfo
      that.setData({
        groupInfo
      })
    }
    //获取图片数组
    var imageList = appInstance.globalData.imageList
    console.log("appInstance.globalData.imageList",imageList)
    if (imageList.length > 0) {
      that.setData({
        imageList
      })
    }
  },

   onReady:function() {
        if (this.data.groupInfo) {
            wx.setNavigationBarTitle({ title: this.data.groupInfo.groupName});
        }
        //console.log("好开心啊啊，我执行了耶",this.data.groupInfo)
   },

  bindTextAreaBlur: function(e){
    console.log(e.detail.value)
    this.setData({
      text:e.detail.value
    })
  },

   chooseImage: function () {
    var that = this
    wx.chooseImage({
      sourceType: sourceType[this.data.sourceTypeIndex],
      sizeType: sizeType[this.data.sizeTypeIndex],
      count: this.data.count[this.data.countIndex],
      success: function (res) {
        console.log(res)
        that.setData({
          imageList: res.tempFilePaths,
          imageListCopy: res.tempFilePaths
        })
      }
    })
  },
  previewImage: function (e) {
    var current = e.target.dataset.src
    wx.previewImage({
      current: current,
      urls: this.data.imageList
    })
  },

  chooseVideo: function () {
    var that = this
    wx.chooseVideo({
      sourceType: videoSourceType[this.data.videoSourceTypeIndex],
      camera: camera[this.data.cameraIndex],
      maxDuration: duration[this.data.durationIndex],
      success: function (res) {
        that.setData({
          src: res.tempFilePath
        })
      }
    })
  },
onHide: function() {
    if (this.data.playing) {
      this.stopVoice()
    } else if (this.data.recording) {
      this.stopRecordUnexpectedly()
    }
  },
  startRecord: function () {
    this.setData({ recording: true })

    var that = this
    recordTimeInterval = setInterval(function () {
      var recordTime = that.data.recordTime += 1
      that.setData({
        formatedRecordTime: util.formatTimeRecord(that.data.recordTime),
        recordTime: recordTime
      })
    }, 1000)
    wx.startRecord({
      success: function (res) {
        that.setData({
          hasRecord: true,
          tempFilePath: res.tempFilePath,
          formatedPlayTime: util.formatTimeRecord(that.data.playTime)
        })
      },
      complete: function () {
        that.setData({ recording: false })
        clearInterval(recordTimeInterval)
      }
    })
  },
  stopRecord: function() {
    wx.stopRecord()
  },
  stopRecordUnexpectedly: function () {
    var that = this
    wx.stopRecord({
      success: function() {
        console.log('stop record success')
        clearInterval(recordTimeInterval)
        that.setData({
          recording: false,
          hasRecord: false,
          recordTime: 0,
          formatedRecordTime: util.formatTimeRecord(0)
        })
      }
    })
  },
  playVoice: function () {
    var that = this //需要设置暂停按钮
    playTimeInterval = setInterval(function () {
      var playTime = that.data.playTime + 1
      console.log('update playTime', playTime)
      that.setData({
        playing: true,
        formatedPlayTime: util.formatTimeRecord(playTime),
        playTime: playTime
      })
    }, 1000)
    wx.playVoice({
      filePath: that.data.tempFilePath,
      success: function () {
        clearInterval(playTimeInterval)
        var playTime = 0
        console.log('play voice finished')
        that.setData({
          playing: false,
          formatedPlayTime: util.formatTimeRecord(playTime),
          playTime: playTime
        })
      }
    })
  },
  pauseVoice: function () {
    clearInterval(playTimeInterval)
    wx.pauseVoice()
    this.setData({
      playing: false
    })
  },
  stopVoice: function () {
    clearInterval(playTimeInterval)
    this.setData({
      playing: false,
      formatedPlayTime: util.formatTimeRecord(0),
      playTime: 0
    })
    wx.stopVoice()
  },
  clear: function () {
    clearInterval(playTimeInterval)
    wx.stopVoice()
    this.setData({
      playing: false,
      hasRecord: false,
      tempFilePath: '',
      formatedRecordTime: util.formatTimeRecord(0),
      recordTime: 0,
      playTime: 0
    })
  },
  ensure:function(){
    wx.stopVoice()
    this.setData({
      playing: false,
      hasRecord: false,
      tempFilePath: '',
      formatedRecordTime: util.formatTimeRecord(0),
      recordTime: 0,
      playTime: 0
    })
  },

  upNotes: function(){
      var that = this
      var authHeader = buildAuthHeader(Session.get());
      var groupInfo = that.data.groupInfo
      var date = Date.now()
      if (groupInfo == null) {
        showAddGroup()
      }
      else{
        wx.request({
          header:{
              'content-type':'application/x-www-form-urlencoded;;charset=UTF-8;',
              'Accept':'application/json'

            },
          url: `https://${config.service.host}/share/new`,
          method:'POST',
          data:{
            'openId': appInstance.globalData.myId,
            'groupId':groupInfo.openId,
            'content':that.data.text,
            'date':date
          },
        
         success(res){
            console.log("res",res)
            var shareId = res.data.data.shareId
            that.uploadImage(shareId)
         /* wx.navigateTo({
            url: '../story/story',
            success: function(res){
              console.log(res)
              // success
            },
            fail: function(res) {
              console.log(res)
            },
          })
          */
        },
              
        fail(res){
          console.log(res)
        }
      })
    }
       
  },

  uploadImage: function(shareId){
    //var imageList = this.data.imageList
    var that = this
    if (this.data.imageList.length > 0) {
      var image = this.data.imageList.shift()
          wx.showToast({
            title:'正在上传',
            icon:'loading',
            duration:5000
          })
          wx.uploadFile({
            //header:authHeader,
            url: `https://${config.service.host}/share/upload`,
            name:"file",
            filePath:image,
            header:{
              'Accept':'application/json'
            },
            formData:{
              'openId': appInstance.globalData.myId,
              'shareId':shareId,
              'type':'images'
            },
            success(res){
              console.log("resresres",res)
              that.uploadImage(shareId)
            },
            fail(res){
              console.log("一失败了呀",res)
            }
          })
    }
    else{
      wx.hideToast()
      wx.showToast({
        title:'上传成功',
        icon:'success',
        duration:2000
      })
      var story = {
        text:that.data.text,
        imageList:that.data.imageListCopy
        //图片和音频后续加上
      }
      event.emit('addStory',story)
      appInstance.globalData.imageList = []
      wx.switchTab({
        url:'../story/story'
      })
    }
  },
  onUnload:function(){
   
  },
  onPullDownRefresh: function(){
        wx.stopPullDownRefresh()
    } 
  //uploadImage()

})
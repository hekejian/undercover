var sourceType = [ ['camera'], ['album'], ['camera', 'album'] ]
var sizeType = [ ['compressed'], ['original'], ['compressed', 'original'] ]
var camera = [ ['front'], ['back'], ['front', 'back'] ]

var appInstance = getApp()
Page({
    data:{
        video:"",
        sourceTypeIndex:0,
        sizeTypeIndex:2,
        count: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        countIndex: 0,
        imageList:null
    },

    onLoad:function(){

    },
    onShow:function(){
        var that = this
        wx.chooseImage({
            sourceType: sourceType[this.data.sourceTypeIndex],
            sizeType: sizeType[this.data.sizeTypeIndex],
            count: this.data.count[this.data.countIndex],
            success: function (res) {
                //var url = "../notes/notes?imagePath="+res.tempFilePaths
                var url = "../notes/notes"
                console.log("resresresrewsr",res)
                appInstance.globalData.imageList = res.tempFilePaths
                that.setData({
                    imageList: res.tempFilePaths
                })
                wx.navigateTo({
                  url: url,
                  success: function(res){
                  },
                })
            },
            fail:function(){
                var url = "../index/index"
                wx.switchTab({
                  url: url,
                  success: function(res){
                  },
                  fail:function(res){
                  }
                })
            }
        })
    }
})
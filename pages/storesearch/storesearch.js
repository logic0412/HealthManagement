// pages/guideMap/guideMap.js
var amapFile = require("./amap-wx.130.js"); // 引入高德地图JSAPI
var amap;
Page({
  data: {
    markers: [],
  },

  onShow: function (options) {
    // 实例化高德地图API核心类
    amap = new amapFile.AMapWX({ key: "0c2aa09a363a540d314c5876f2365eb4" });

    this.getCurrentLocation();
  },

  resetMap: function () {
    let that = this;
    // 清除地图上的所有markers和polyline
    that.setData({
      datatlist: [], // 清空标记
      polyline: [], // 清空路径
    });

    // 重新获取当前位置并更新地图
    that.getCurrentLocation();
  },

  getCurrentLocation: function () {
    var that = this;
    // 获取当前定位
    wx.getLocation({
      type: "gcj02",
      success: function (res) {
        var currentLocation = res.longitude + "," + res.latitude; // 设置为字符串格式 "经度,纬度"
        that.setData({
          latitude: res.latitude,
          longitude: res.longitude,
          currentLocation: currentLocation, // 确保这里设置了currentLocation
          markersStatus: true,
        });

        // 搜索附近的药店
        that.getAround(res.latitude, res.longitude);
      },
      fail: function (res) {
        console.log("定位失败:", res);
        wx.showToast({
          title: "定位失败，请确保GPS已开启",
          icon: "none",
        });
      },
    });
  },

  getAround: function (latitude, longitude) {
    // 使用高德地图搜索附近的药店
    amap.getPoiAround({
      iconPathSelected: "assets/icons/299087_marker_map_icon.png", //选中的图标
      iconPath: "assets/icons/299087_marker_map_icon.png", //默认图标
      location: `${longitude},${latitude}`,
      querykeywords: "药店",
      success: (res) => {
        const markers = res.markers;
        this.setData({ datatlist: markers });
      },
      fail: (error) => {
        console.log(error);
      },
    });
  },

  markertap(e) {
    var that = this;
    console.log("被点击了----》", e);
    let marks = this.data.datatlist;
    for (let i = 0; i < marks.length; i++) {
      if (marks[i].id == e.markerId) {
        console.log(marks[i].longitude, marks[i].latitude);
        let targetLocation =
          marks[i].longitude.toString() + "," + marks[i].latitude.toString();
        that.gotoLocation(targetLocation);
        break;
      }
    }
  },

  gotoLocation: function (targetLocation) {
    let that = this;
    console.log("tst1", that.data.currentLocation);
    console.log("tst2", targetLocation);
    // 使用高德地图的步行路径规划
    amap.getWalkingRoute({
      origin: that.data.currentLocation,
      destination: targetLocation,
      success: function (res) {
        console.log("tst3", 1);
        if (res.paths && res.paths[0] && res.paths[0].steps) {
          console.log("路径规划成功", res);

          var steps = res.paths[0].steps;
          var polyline = [];
          for (var i = 0; i < steps.length; i++) {
            var poLen = steps[i].polyline.split(";");
            for (var j = 0; j < poLen.length; j++) {
              polyline.push({
                latitude: parseFloat(poLen[j].split(",")[1]),
                longitude: parseFloat(poLen[j].split(",")[0]),
              });
            }
          }

          that.setData({
            polyline: [
              {
                points: polyline,
                color: "#1AAD19",
                width: 3,
                dottedLine: false,
              },
            ],
          });
        }
      },
      fail: function (error) {
        console.error("路径规划失败", error);
      },
    });
  },
});

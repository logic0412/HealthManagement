Page({
  data: {
    inputVal: "",
    inputShowed: false,
    searchResult: [],
    markers: [],
  },

  showInput: function () {
    this.setData({
      inputShowed: true,
    });
  },

  hideInput: function () {
    this.setData({
      inputVal: "",
      inputShowed: false,
      searchResult: [],
    });
  },

  clearInput: function () {
    this.setData({
      inputVal: "",
    });
  },

  inputTyping: function (e) {
    console.log("Current input:", e.detail.value);
    this.setData({
      inputVal: e.detail.value,
    });
  },

  searchDrugs: function () {
    const keyword = this.data.inputVal.trim();
    console.log("Searching for:", keyword); // 输出搜索关键词

    if (!keyword) {
      wx.showToast({
        title: "请输入搜索关键词",
        icon: "none",
      });
      return;
    }

    const that = this;
    wx.request({
      url: "http://58.35.232.125:3000/api/search/drugs",
      data: {
        keyword: keyword,
      },
      success: function (res) {
        console.log("Search results:", res.data); // 输出搜索结果
        if (res.data.success) {
          that.setData({
            searchResult: res.data.drugs,
          });
        } else {
          wx.showToast({
            title: "搜索失败: " + res.data.message,
            icon: "none",
          });
        }
      },
      fail: function () {
        wx.showToast({
          title: "网络错误",
          icon: "none",
        });
      },
    });
  },

  searchNearbyStores: function () {
    console.log("Search results:", 1)
    const that = this;
    wx.getLocation({
      type: "gcj02",
      success(res) {
        const latitude = res.latitude;
        const longitude = res.longitude;

        // 更新地图到用户当前位置
        that.setData({
          latitude: latitude,
          longitude: longitude,
        });

        // 请求附近药店信息
        wx.request({
          url: "http://58.35.232.125:3000/api/search/nearby-stores",
          data: {
            latitude: latitude,
            longitude: longitude,
          },
          success: function (response) {
            if (response.data.success) {
              const markers = response.data.stores.map((store) => ({
                id: store.id,
                latitude: store.location.lat,
                longitude: store.location.lng,
                iconPath: "/resources/location.png",
                width: 30,
                height: 30,
              }));
              that.setData({
                markers: markers,
              });
            } else {
              wx.showToast({
                title: "搜索失败: " + response.data.message,
                icon: "none",
              });
            }
          },
          fail: function () {
            wx.showToast({
              title: "请求失败",
              icon: "none",
            });
          },
        });
      },
      fail() {
        wx.showToast({
          title: "定位失败",
          icon: "none",
        });
      },
    });
  },
});

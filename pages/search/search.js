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
    const that = this;
    wx.getLocation({
      type: "wgs84",
      success(res) {
        const latitude = res.latitude;
        const longitude = res.longitude;
        wx.request({
          url: "腾讯位置服务API或其他地图API",
          data: {
            latitude: latitude,
            longitude: longitude,
          },
          success: function (res) {
            const markers = res.data.map((item) => ({
              id: item.id,
              latitude: item.latitude,
              longitude: item.longitude,
              name: item.name,
            }));
            that.setData({
              markers: markers,
            });
          },
        });
      },
    });
  },
});

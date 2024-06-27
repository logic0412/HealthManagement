Page({
  data: {
    inputVal: "",
    inputShowed: false,
    searchResult: [],
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
    console.log("Searching for:", keyword);

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
        data: { keyword: keyword },
        success: function (res) {
            console.log("Search results:", res.data);
            if (res.data.success && res.data.drugs.length > 0) {
                that.setData({
                    searchResult: res.data.drugs,
                });
            } else if (res.data.success && res.data.drugs.length === 0) {
                wx.showToast({
                    title: "未找到匹配的药品",
                    icon: "none",
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
}

});

// reminders.js
Page({

  data: {
    medications: []
  },

  onShow: function() {
    const app = getApp();
    if (!app.globalData.isUserLoggedIn) {
      // 用户未登录，显示模态对话框提示登录
      wx.showModal({
        title: '提示',
        content: '您尚未登录，请登录后使用完整功能',
        showCancel: false,
        confirmText: '去登录',
        success: (result) => {
          if (result.confirm) {
            // 用户点击去登录，跳转到我的页面
            wx.switchTab({
              url: '/pages/profile/profile' // 确保你的“我的”页面路由正确
            });
          }
        }
      });
    } else {
      // 已登录状态下执行的代码
      this.loadMedications();
    }
  },

  onLoad: function() {
    this.loadMedications();
  },

  loadMedications: function () {
    const app = getApp();
    const userInfo = app.globalData.userInfo;
    wx.request({
      url: "http://192.168.71.16:3000/api/medications",
      method: "GET",
      data: { phone: userInfo.phone },
      success: (res) => {
        if (res.data.success) {
          this.setData({ medications: res.data.medications });
        } else {
          wx.showToast({
            title: "加载失败",
            icon: "none",
          });
        }
      },
    });
  },
});
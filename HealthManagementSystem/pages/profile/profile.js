// pages/profile/profile.js
Page({
  data: {
    userInfo: {}
  },

  onShow: function() {
    const app = getApp();
    if (app.globalData.isUserLoggedIn) {
      const userInfo = wx.getStorageSync('userInfo');
      this.setData({
        userInfo: userInfo
      });
    } else {
      this.setData({
        userInfo: {} // 清空用户信息显示默认
      });
    }
  },

  goToLogin: function() {
    if (!this.data.userInfo.nickName) {
      wx.navigateTo({
        url: '/pages/login/login' // 确保你的登录页面路径正确
      });
    }
  }
});

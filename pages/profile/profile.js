// pages/profile/profile.js
const app = getApp();  // 获取App实例

Page({
  data: {
    userInfo: {},
  },

  onShow: function() {
    // 直接使用全局数据更新页面数据
    if (app.globalData.isUserLoggedIn) {
      this.setData({
        userInfo: app.globalData.userInfo  // 使用全局的用户信息
      });
    } else {
      this.setData({
        userInfo: {}  // 清空用户信息显示默认
      });
    }
  },

  handleTap: function() {
    // 根据登录状态决定跳转目标
    if (app.globalData.isUserLoggedIn) {
      wx.navigateTo({
        url: '/pages/myprofile/myprofile'  // 确保你已创建myprofile页面
      });
    } else {
      wx.navigateTo({
        url: '/pages/login/login'
      });
    }
  }
});

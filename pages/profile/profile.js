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
        url: '/pages/myprofile/myprofile'
      });
    } else {
      wx.navigateTo({
        url: '/pages/login/login'
      });
    }
  },

  logout: function() {
    const app = getApp();
    // 清空全局登录状态
    app.globalData.userInfo = null;
    app.globalData.isUserLoggedIn = false;

    // 可选：清除可能存储的用户信息
    wx.clearStorage();

    // 提示用户已退出
    wx.showToast({
      title: '已退出登录',
      icon: 'success',
      duration: 2000,
      complete: function() {
        setTimeout(() => {
          wx.reLaunch({
            url: '/pages/index/index'
          });
        }, 2000); // 2秒后跳转
      }
    });
  }
});

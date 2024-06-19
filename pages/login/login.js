// pages/login/login.js
const app = getApp();  // 获取App实例

Page({
  data: {
    phone: '',
    password: ''
  },

  inputPhone: function(e) {
    this.setData({ phone: e.detail.value });
  },

  inputPassword: function(e) {
    this.setData({ password: e.detail.value });
  },

  wechatLogin: function(e) {
    wx.login({
      success: res => {
        if (res.code) {
          wx.request({
            url: 'http://58.35.232.125:3000/api/wechat-login',  // 服务器API地址
            method: 'POST',
            data: { code: res.code },
            success: (resp) => {
              if (resp.data.success) {
                // 更新全局状态
                app.globalData.userInfo = resp.data.user;
                app.globalData.isUserLoggedIn = true;

                // 登录成功，存储用户信息到本地存储
                wx.setStorageSync('userInfo', resp.data.user);
                wx.setStorageSync('session_key', resp.data.session_key);

                wx.showToast({
                  title: '登录成功',
                  icon: 'success',
                  complete: () => {
                    wx.switchTab({
                      url: '/pages/index/index'
                    });
                  }
                });
              } else {
                wx.showToast({ title: '登录失败', icon: 'none' });
              }
            },
            fail: () => {
              wx.showToast({ title: '服务器请求失败', icon: 'none' });
            }
          });
        } else {
          wx.showToast({ title: '获取用户登录态失败', icon: 'none' });
        }
      }
    });
  },

  manualLogin: function() {
    wx.request({
      url: 'http://58.35.232.125:3000/api/login',
      method: 'POST',
      data: { phone: this.data.phone, password: this.data.password },
      success: (res) => {
        if (res.data.success) {
          // 更新全局状态
          app.globalData.userInfo = res.data.user;
          app.globalData.isUserLoggedIn = true;

          // 登录成功，存储用户信息
          wx.setStorageSync('userInfo', res.data.user);

          wx.showToast({
            title: '登录成功',
            icon: 'success',
            complete: () => {
              wx.switchTab({
                url: '/pages/index/index'
              });
            }
          });
        } else {
          wx.showToast({ title: res.data.message || '登录失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络请求失败', icon: 'none' });
      }
    });
  }
});

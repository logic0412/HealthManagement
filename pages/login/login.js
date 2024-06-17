// pages/login/login.js
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
            // 调用后端API，传递code
            wx.request({
              url: 'http://192.168.71.16:3000/api/wechat-login',  // 服务器API地址
              method: 'POST',
              data: {
                code: res.code
              },
              success: (resp) => {
                if (resp.data.success) {
                  const app = getApp();
                  app.globalData.userInfo = resp.data.user;
                  app.globalData.isUserLoggedIn = true;
              
                  // 登录成功，存储用户信息
                  wx.setStorageSync('userInfo', resp.data.user);
                  wx.setStorageSync('session_key', resp.data.session_key);
                  wx.showToast({
                    title: '登录成功',
                    icon: 'success'
                  });
                  wx.switchTab({
                    url: '/pages/index/index'
                  });
                } else {
                  wx.showToast({
                    title: '登录失败',
                    icon: 'none'
                  });
                }
              },
              fail: () => {
                wx.showToast({
                  title: '服务器请求失败',
                  icon: 'none'
                });
              }
            });
          } else {
            wx.showToast({
              title: '获取用户登录态失败',
              icon: 'none'
            });
          }
        }
      });
    },
    manualLogin: function() {
      // 调用自定义登录API
      wx.request({
        url: 'http://192.168.71.16:3000/api/login', // 确保后端API和端口设置正确
        method: 'POST',
        data: {
          phone: this.data.phone,
          password: this.data.password
        },
        success: (res) => {
          if (res.data.success) {
            const app = getApp();
            app.globalData.userInfo = res.data.user;
            app.globalData.isUserLoggedIn = true;

            // 登录成功，存储用户信息到本地存储
            wx.setStorageSync('userInfo', res.data.user);
            wx.showToast({
              title: '登录成功',
              icon: 'success',
              duration: 2000,
              complete: () => {
                wx.switchTab({
                  url: '/pages/index/index'
                });
              }
            });
          } else {
            // 登录失败，显示错误信息
            wx.showToast({
              title: res.data.message || '登录失败',
              icon: 'none'
            });
          }
        },
        fail: () => {
          // 网络请求失败
          wx.showToast({
            title: '网络请求失败',
            icon: 'none'
          });
        }
      });
    }
  });
  
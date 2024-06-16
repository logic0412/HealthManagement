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
              url: 'http://127.0.0.1:3000/api/wechat-login',  // 服务器API地址
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
        url: 'http://127.0.0.1:3000/api/login', // API地址需要根据实际情况进行设置
        method: 'POST',
        data: {
          phone: this.data.phone,
          password: this.data.password
        },
        success: function(res) {
          // 处理登录成功
        },
        fail: function() {
          // 处理登录失败
        }
      });
    }
  });
  
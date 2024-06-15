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
      // 处理微信登录
    },
    manualLogin: function() {
      // 调用自定义登录API
      wx.request({
        url: 'http://122.9.184.225/api/login', // API地址需要根据实际情况进行设置
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
  
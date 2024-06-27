// pages/myprofile/myprofile.js
const app = getApp();

Page({
    data: {
        userInfo: {}
    },

    onLoad: function() {
        this.setData({
            userInfo: app.globalData.userInfo
        });
    },

    onInput: function(e) {
        const field = e.currentTarget.dataset.field;
        this.setData({
            [`userInfo.${field}`]: e.detail.value
        });
    },

    onTimeChange: function(e) {
        const field = e.currentTarget.dataset.field;
        this.setData({
            [`userInfo.${field}`]: e.detail.value
        });
    },

    updateUserInfo: function() {
        // 发送请求到服务器更新用户信息
        wx.request({
            url: 'http://58.35.232.125:3000/api/updateUserInfo', 
            method: 'POST',
            data: this.data.userInfo,
            success: (res) => {
                if (res.data.success) {
                    wx.showToast({
                        title: '信息更新成功',
                        icon: 'success'
                    });
                    // 更新全局userInfo
                    app.globalData.userInfo = this.data.userInfo;
                    // 本地存储同步更新
                    wx.setStorageSync('userInfo', this.data.userInfo);
                } else {
                    wx.showToast({
                        title: '更新失败',
                        icon: 'none'
                    });
                }
            }
        });
    },

    resetPassword: function() {
        // 跳转到重置密码页面
        wx.navigateTo({
            url: '/pages/resetPassword/resetPassword'
        });
    }
});

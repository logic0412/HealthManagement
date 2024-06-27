// pages/resetPassword/resetPassword.js

const app = getApp();  // 获取App实例

Page({
    data: {
        oldPassword: '',
        newPassword: ''
    },

    onInput: function(e) {
        this.setData({
            [e.currentTarget.dataset.field]: e.detail.value
        });
    },

    submitPasswordChange: function() {
        const userInfo = app.globalData.userInfo;  // 从全局状态获取用户信息
        if (!this.data.oldPassword || !this.data.newPassword || !this.data.confirmNewPassword) {
            wx.showToast({
                title: '所有字段均不能为空',
                icon: 'none'
            });
            return;
        }
        if (this.data.newPassword !== this.data.confirmNewPassword) {
            wx.showToast({
                title: '两次输入的新密码不一致',
                icon: 'none'
            });
            return;
        }
        wx.request({
            url: 'http://58.35.232.125:3000/api/changePassword',
            method: 'POST',
            data: {
                phone: userInfo.phone,
                oldPassword: this.data.oldPassword,
                newPassword: this.data.newPassword
            },
            success: (res) => {
                if (res.data.success) {
                    wx.showToast({
                        title: '密码更新成功',
                        icon: 'success'
                    });
                    wx.navigateBack(); // 返回上一页
                } else {
                    wx.showToast({
                        title: res.data.message,
                        icon: 'none'
                    });
                }
            }
        });
    }
});

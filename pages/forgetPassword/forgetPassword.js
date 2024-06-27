// pages/forgetPassword/forgetPassword.js
Page({
    data: {
        name: '',
        phone: ''
    },

    inputName: function(e) {
        this.setData({ name: e.detail.value });
    },

    inputPhone: function(e) {
        this.setData({ phone: e.detail.value });
    },

    resetPassword: function() {
        if (!this.data.name || !this.data.phone) {
            wx.showToast({
                title: '姓名和手机号不能为空',
                icon: 'none'
            });
            return;
        }
        wx.request({
            url: 'http://58.35.232.125:3000/api/resetPassword',
            method: 'POST',
            data: {
                name: this.data.name,
                phone: this.data.phone,
                newPassword: '12345678'  // 直接重置密码为12345678
            },
            success: (res) => {
                if (res.data.success) {
                    wx.showToast({
                        title: '密码重置成功',
                        icon: 'success',
                        duration: 2000
                    });
                    wx.showModal({
                        title: '密码重置成功',
                        content: '您的密码已经成功重置为默认密码12345678，请登录后立即修改密码以保证账户安全。',
                        showCancel: false, // 不显示取消按钮
                        confirmText: '我知道了', // 只提供一个按钮
                        success: function(res) {
                            if (res.confirm) {
                                wx.navigateTo({
                                    url: '/pages/login/login'
                                });
                            }
                        }
                    });
                } else {
                    wx.showToast({
                        title: res.data.message,
                        icon: 'none'
                    });
                }
            },
            fail: () => {
                wx.showToast({
                    title: '请求失败',
                    icon: 'none'
                });
            }
        });
    }
});

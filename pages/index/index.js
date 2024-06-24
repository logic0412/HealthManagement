// index.js
Page({
  data: {
    medications: [],
    showModal: false,
    richTextDetails: "",
    isEditing: false,
    currentMedication: {},
  },

  onShow: function () {
    const app = getApp();
    if (!app.globalData.isUserLoggedIn) {
      // 用户未登录，显示模态对话框提示登录
      wx.showModal({
        title: "提示",
        content: "您尚未登录，请登录后使用完整功能",
        showCancel: false,
        confirmText: "去登录",
        success: (result) => {
          if (result.confirm) {
            // 用户点击去登录，跳转到我的页面
            wx.switchTab({
              url: "/pages/profile/profile", // 确保你的“我的”页面路由正确
            });
          }
        },
      });
    } else {
      // 已登录状态下执行的代码
    }
  },

  startEditing: function () {
    this.setData({ isEditing: true });
  },

  inputChange: function (e) {
    const param = e.currentTarget.dataset.param;
    const value = e.detail.value; // 获取输入值，对于日期来说，应直接使用，无需进一步格式化
    this.setData({
      [`currentMedication.${param}`]: value,
    });
  },

  onDateChange: function (e) {
    const param = e.currentTarget.dataset.param;
    this.setData({
      [`currentMedication.${param}`]: e.detail.value,
    });
  },

  // pages/index/index.js
  showCreateForm: function () {
    // 设置默认值或空值以供新建药单使用
    this.setData({
      currentMedication: {
        id: "", // 确保 id 为空，表示这是新建的药单
        name: "",
        dosage: "",
        frequency: "",
        start_date: "",
        end_date: "",
        notes: "",
      },
      showModal: true,
      isEditing: true, // 直接进入编辑模式
    });
  },

  deleteMedication: function () {
    const medicationId = this.data.currentMedication.id;
    wx.request({
      url: `http://192.168.71.16:3000/api/medications/${medicationId}`,
      method: "DELETE",
      success: (res) => {
        if (res.data.success) {
          wx.showToast({ title: "药单已删除", icon: "success" });
          this.closeDetails();
          this.loadMedications(); // Reload to reflect deletion
        } else {
          wx.showToast({ title: res.data.message, icon: "none" });
        }
      },
    });
  },

  // pages/index/index.js
  saveChanges: function () {
    const url = this.data.currentMedication.id
      ? `http://192.168.71.16:3000/api/medications/${this.data.currentMedication.id}` // 如果有 id 则更新
      : `http://192.168.71.16:3000/api/medications`; // 没有 id 则创建新的药单

    wx.request({
      url: url,
      method: this.data.currentMedication.id ? "PUT" : "POST",
      data: this.data.currentMedication,
      success: (res) => {
        if (res.data.success) {
          wx.showToast({ title: "操作成功", icon: "success" });
          this.closeDetails();
          this.loadMedications(); // 重新加载药单列表以显示最新的数据
        } else {
          wx.showToast({ title: res.data.message, icon: "none" });
        }
      },
      fail: () => {
        wx.showToast({ title: "请求失败", icon: "none" });
      },
    });
  },

  onLoad: function () {
    this.loadMedications();
  },

  loadMedications: function () {
    const app = getApp();
    const userInfo = app.globalData.userInfo;
    wx.request({
      url: "http://192.168.71.16:3000/api/medications",
      method: "GET",
      data: { phone: userInfo.phone },
      success: (res) => {
        if (res.data.success) {
          this.setData({ medications: res.data.medications });
        } else {
          wx.showToast({
            title: "加载失败",
            icon: "none",
          });
        }
      },
    });
  },

  formatDate: function (dateStr) {
    // 确保输入的日期字符串是有效的
    if (!dateStr) return "无"; // 处理空值
    let date = new Date(dateStr);
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    return `${year}-${month.toString().padStart(2, "0")}-${day
      .toString()
      .padStart(2, "0")}`;
  },

  showDetails: function (e) {
    const item = e.currentTarget.dataset.item;
    const formattedItem = {
      ...item,
      start_date: this.formatDate(item.start_date), // 确保日期格式化
      end_date: this.formatDate(item.end_date), // 确保日期格式化
    };

    const details = `剂量: ${item.dosage}<br/>频率: ${
      item.frequency
    }<br/>开始日期: ${formattedItem.start_date}<br/>结束日期: ${
      formattedItem.end_date
    }<br/>备注: ${item.notes || "无"}`;

    this.setData({
      currentMedication: formattedItem, // 使用已格式化的日期数据
      currentMedicationName: item.name,
      richTextDetails: details,
      showModal: true,
      isEditing: false,
    });
  },

  closeDetails: function () {
    this.setData({
      showModal: false,
      isEditing: false,
      currentMedication: {},
    });
  },
});

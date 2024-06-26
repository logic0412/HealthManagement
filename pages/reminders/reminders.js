Page({
  data: {
    userMealTimes: {},
    todayMedications: [], // 存储今天需要服用的药物
    hourlySchedule: {}, // 存储按小时划分的药物计划
    showModal: false,
    currentMedication: {},
    currentMedicationName: '',
    richTextDetails: '',
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
      this.fetchUserMealTimes().then(userMealTimes => {
        this.setData({ userMealTimes });
        return this.loadTodayMedications();
      }).then(medications => {
        let hourlySchedule = this.distributeMedications(medications, this.data.userMealTimes);
        this.setData({ hourlySchedule });
      }).catch(error => {
        wx.showToast({ title: '加载失败: ' + error, icon: 'none' });
      });
    }
  },

  onLoad: function() {
    this.checkAndUpdateNextDoseDate().then(() => {
      return this.fetchUserMealTimes();
    }).then(userMealTimes => {
      this.setData({ userMealTimes });
      return this.loadTodayMedications();
    }).then(medications => {
      let hourlySchedule = this.distributeMedications(medications, this.data.userMealTimes);
      this.setData({ hourlySchedule });
    }).catch(error => {
      wx.showToast({ title: '加载失败: ' + error, icon: 'none' });
    });
  },

  // 获取用户的饭点时间
  fetchUserMealTimes: function() {
    const app = getApp();  // 获取全局应用实例
    const userPhone = app.globalData.userInfo.phone;
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'http://192.168.71.16:3000/api/user-meal-times',
        method: 'GET',
        data: { phone:userPhone },
        success: (res) => {
          if (res.data.success) {
            resolve(res.data.userMealTimes);
          } else {
            reject('无法获取饭点时间: ' + res.data.message);
          }
        },
        fail: () => {
          reject("网络请求失败");
        }
      });
    });
  },

  // 获取今日需要服用的药物
  loadTodayMedications: function() {
    const app = getApp();  // 获取全局应用实例
    const userPhone = app.globalData.userInfo.phone;
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'http://192.168.71.16:3000/api/medications/today',
        method: 'GET',
        data: {phone :userPhone},
        success: (res) => {
          console.log("Loaded medications:", res.data.medications); // 打印获取的药物数据
          app.globalData.todayMedications = res.data.medications; // 保存到全局变量
          this.setData({ todayMedications: res.data.medications }); // 更新页面数据
          if (res.data.success) {
            resolve(res.data.medications);
          } else {
            reject('无法加载今日药物: ' + res.data.message);
          }
        },
        fail: () => {
          reject("请求失败");
        }
      });
    });
  },

  // 分配药物到每日的具体饭点时间
  distributeMedications: function (medications, userMealTimes) {
    const { breakfast_time, lunch_time, dinner_time } = userMealTimes;
    let schedule = {};

    medications.forEach(med => {
      let timesPerDay = parseInt(med.frequency) - parseInt(med.taken_today);
      let medTimes = [];

      if (timesPerDay === 1) {
        medTimes.push(lunch_time);
      } else if (timesPerDay === 2) {
        medTimes.push(lunch_time, dinner_time);
      } else if (timesPerDay === 3) {
        medTimes.push(breakfast_time, lunch_time, dinner_time);
      }

      medTimes.forEach(time => {
        if (!schedule[time]) { schedule[time] = []; }
        schedule[time].push({
          id: med.id,
          name: med.name,
          dosage: med.dosage,
          takenToday: med.taken_today
        });
      });
    });

    return schedule;
  },

  checkAndUpdateNextDoseDate: function() {
    const app = getApp();  // 获取全局应用实例
    const userPhone = app.globalData.userInfo.phone;
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'http://192.168.71.16:3000/api/medications/update-next-dose',
        method: 'POST',
        data: { phone: userPhone },
        success: (res) => {
          if (res.data.success) {
            resolve();
          } else {
            reject('无法更新服药日期: ' + res.data.message);
          }
        },
        fail: () => {
          reject("网络请求失败");
        }
      });
    });
  },

  updateNextDoseDay: function(medications) {
    const today = new Date();
    medications.forEach(med => {
      if (med.next_dose_date && med.end_date) {
        const nextDoseDate = new Date(med.next_dose_date);
        const endDate = new Date(med.end_date);
        // 如果今天的日期小于等于结束日期并且等于next_dose_date，则增加一天
        if (today <= endDate && today.toISOString().slice(0, 10) === med.next_dose_date) {
          nextDoseDate.setDate(nextDoseDate.getDate() + 1);
          // 更新next_dose_date，确保不超过end_date
          if (nextDoseDate <= endDate) {
            med.next_dose_date = nextDoseDate.toISOString().slice(0, 10);
          }
        }
      }
    });
    return medications;
  },
  
  // 显示药物用量和备注
  showDetails: function(e) {
    const app = getApp();
    const medicationId = parseInt(e.currentTarget.dataset.id); // 获取绑定的药品 ID，确保转为整数类型
    const item = app.globalData.todayMedications.find(med => med.id === medicationId); // 根据 ID 查找匹配的药品对象
  
    if (!item) {
      wx.showToast({
        title: '未找到药品信息',
        icon: 'none'
      });
      return;
    }
  
    const details = `剂量: ${item.dosage}<br/>备注: ${item.notes || '无'}`;
  
    this.setData({
      currentMedication: item,
      currentMedicationName: item.name,
      richTextDetails: details,
      showModal: true, // 显示模态框
    });
  },

  closeDetails: function () {
    this.setData({
      showModal: false
    });
  }

});

Page({
  data: {
    todayMedications: [], // 存储今天需要服用的药物
  },

  // 将药物分配到每个时间段
  distributeMedications: function (medications) {
    let schedule = new Array(24).fill(null).map(() => []);

    medications.forEach((med) => {
      let interval = 24 / med.frequency; // 计算服药间隔
      for (let i = 0; i < 24; i += interval) {
        let hour = Math.floor(i);
        schedule[hour].push({
          name: med.name,
          dosage: med.dosage,
        });
      }
    });

    return schedule;
  },

  onLoad: function() {
    this.loadTodayMedications().then(medications => {
      let hourlySchedule = this.distributeMedications(medications);
      this.setData({ hourlySchedule });
    }).catch(error => {
      wx.showToast({ title: '加载失败: ' + error, icon: 'none' });
    });
  },
  

  loadTodayMedications: function() {
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'http://58.35.232.125:3000/api/medications/today',
        method: 'GET',
        success: (res) => {
          if (res.data.success) {
            resolve(res.data.medications);  // 成功时解析medications数据
          } else {
            reject(res.data.message);  // 失败时拒绝错误信息
          }
        },
        fail: () => {
          reject("请求失败");  // 网络或其他原因失败
        }
      });
    });
  },
  
});

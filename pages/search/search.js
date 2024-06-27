// pages/guideMap/guideMap.js
Page({
  goToDrugSearch: function() {
    wx.navigateTo({
      url: '/pages/drugsearch/drugsearch'
    });
  },

  goToStoreSearch: function() {
    wx.navigateTo({
      url: '/pages/storesearch/storesearch'
    });
  }
});

// app.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const axios = require('axios');
const bcrypt = require('bcrypt');

const app = express();
app.use(bodyParser.json());

console.log('Database Host:', process.env.DB_HOST);
console.log('App ID:', process.env.WX_APPID);
console.log('App Secret:', process.env.WX_SECRET);

// 使用环境变量来配置数据库连接
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) throw err;
  console.log('Database connected!');
});

// 微信登录API
app.post('/api/wechat-login', async (req, res) => {
    const { code } = req.body;
    const appid = process.env.WX_APPID; // 从环境变量获取AppID
    const secret = process.env.WX_SECRET; // 从环境变量获取AppSecret
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
  
    try {
      const response = await axios.get(url);
      if (response.data.openid) {
        // 你可能需要根据openid查找或创建一个用户，并生成一个自定义登录态
        res.send({
          success: true,
          user: { 
            id: response.data.openid,  // 示例，实际应用时应有更复杂的用户识别逻辑
            avatarUrl: "",  // 你可以添加更多的用户信息
            nickName: ""
          },
          session_key: response.data.session_key
        });
      } else {
        res.send({ success: false, message: '微信登录失败' });
      }
    } catch (error) {
      res.status(500).send({ success: false, message: '服务器错误', error: error.message });
    }
  });

// 登录或注册API
app.post('/api/login', (req, res) => {
  const { phone, password } = req.body;
  const sqlFindUser = 'SELECT * FROM users WHERE phone = ?';
  db.query(sqlFindUser, [phone], async (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).send({ success: false, message: '数据库查询错误' });
    }
    if (results.length > 0) {
      // 用户存在，验证密码
      const user = results[0];
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (passwordMatch) {
        const { password, ...userInfo } = user; // 剔除密码信息
        res.send({ success: true, user: userInfo });
      } else {
        res.send({ success: false, message: '密码错误' });
      }
    } else {
      // 用户不存在，创建新用户
      const hashedPassword = await bcrypt.hash(password, 10); // 加密密码
      const defaultMealTime = '08:00:00'; // 设置默认餐饮时间为早上8点，按需要调整
      const sqlCreateUser = `
        INSERT INTO users 
        (username, name, email, phone, password, breakfast_time, lunch_time, dinner_time) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      const defaultEmail = `default@example.com`; // 示例邮箱，应调整为适当的值或从请求中获取
      db.query(sqlCreateUser, [phone, 'New User', defaultEmail, phone, hashedPassword, defaultMealTime, defaultMealTime, defaultMealTime], (err, result) => {
        if (err) {
          console.error('Error creating user:', err);
          return res.status(500).send({ success: false, message: '创建用户失败' });
        }
        const newUser = {
          id: result.insertId,
          username: phone,
          name: phone,
          email: defaultEmail,
          phone: phone,
          breakfast_time: defaultMealTime,
          lunch_time: defaultMealTime,
          dinner_time: defaultMealTime
        }
        res.send({ success: true, user: newUser });
      });
    }
  });
});

// 更新用户信息API
app.post('/api/updateUserInfo', (req, res) => {
  const { id, username, name, email, phone, breakfast_time, lunch_time, dinner_time } = req.body;

  const sql = `
      UPDATE users SET
      username = ?,
      name = ?,
      email = ?,
      phone = ?,
      breakfast_time = ?,
      lunch_time = ?,
      dinner_time = ?
      WHERE id = ?`;

  db.query(sql, [username, name, email, phone, breakfast_time, lunch_time, dinner_time, id], (err, result) => {
      if (err) {
          console.error('Failed to update user info:', err);
          res.status(500).send({ success: false, message: 'Failed to update user information.' });
      } else {
          console.log('Updated user info successfully.');
          res.send({ success: true, message: 'User information updated successfully.' });
      }
  });
});

// 重置密码API
app.post('/api/changePassword', (req, res) => {
  const { phone, oldPassword, newPassword } = req.body;

  // 根据手机号找到用户
  const sqlFindUser = 'SELECT * FROM users WHERE phone = ?';
  db.query(sqlFindUser, [phone], async (err, results) => {
      if (err) {
          console.error('Database query error:', err);
          return res.status(500).send({ success: false, message: '数据库查询错误' });
      }
      if (results.length > 0) {
          const user = results[0];
          const passwordMatch = await bcrypt.compare(oldPassword, user.password);
          if (passwordMatch) {
              const hashedNewPassword = await bcrypt.hash(newPassword, 10);
              const sqlUpdatePassword = 'UPDATE users SET password = ? WHERE phone = ?';
              db.query(sqlUpdatePassword, [hashedNewPassword, phone], (err, result) => {
                  if (err) {
                      console.error('Failed to update password:', err);
                      return res.status(500).send({ success: false, message: '密码更新失败' });
                  }
                  res.send({ success: true, message: '密码更新成功' });
              });
          } else {
              res.send({ success: false, message: '旧密码不正确' });
          }
      } else {
          res.status(404).send({ success: false, message: '用户不存在' });
      }
  });
});

// 搜索药品信息
app.get('/api/search/drugs', (req, res) => {
  const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  db.connect(err => {
    if (err) {
      console.error('Database connection error:', err);
      return res.status(500).send({ success: false, message: '数据库连接失败' });
    }

    const { keyword } = req.query;
    const searchKeyword = `%${keyword}%`;
    const sqlSearchDrug = 'SELECT * FROM drug_info WHERE name LIKE ? OR description LIKE ?';

    db.query(sqlSearchDrug, [searchKeyword, searchKeyword], (err, results) => {
      db.end(); // 关闭数据库连接
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).send({ success: false, message: '数据库查询错误' });
      }
      res.send({ success: true, drugs: results });
    });
  });
});



// 搜索附近的药店
app.get('/api/search/nearby-stores', async (req, res) => {
  const { latitude, longitude } = req.query;
  if (!latitude || !longitude) {
    return res.status(400).send({ success: false, message: '需要提供经纬度信息' });
  }
  const radius = 1000; // 搜索半径为1000米，可以根据实际需要调整
  const url = `https://apis.map.qq.com/ws/place/v1/search?boundary=nearby(${latitude},${longitude},${radius})&keyword=药店&key=你的腾讯位置服务API密钥`;

  try {
    const response = await axios.get(url);
    if (response.data.status === 0) { // 状态码0表示请求成功
      res.send({ success: true, stores: response.data.data });
    } else {
      res.send({ success: false, message: '地图服务请求失败', detail: response.data.message });
    }
  } catch (error) {
    res.status(500).send({ success: false, message: '服务器错误', error: error.message });
  }
});


// 监听端口
const port = 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


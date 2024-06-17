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
  database: process.env.DB_DATABASE
});

db.connect(err => {
  if (err) throw err;
  console.log('Database connected!');
});

// 登录API
app.post('/api/login', (req, res) => {
  const { phone, password } = req.body;
  const sql = 'SELECT * FROM users WHERE phone = ? AND password = ?';
  db.query(sql, [phone, password], (err, result) => {
    if (err) res.status(500).send({ success: false, message: 'Database error' });
    else if (result.length > 0) res.send({ success: true, user: result[0] });
    else res.send({ success: false, message: '登录失败，请检查手机号和密码是否正确' });
  });
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
      const sqlCreateUser = 'INSERT INTO users (username, name, email, phone, password) VALUES (?, ?, ?, ?, ?)';
      const defaultEmail = `${phone}@example.com`; // 示例邮箱，应调整为适当的值或从请求中获取
      db.query(sqlCreateUser, [phone, 'New User', defaultEmail, phone, hashedPassword], (err, result) => {
        if (err) {
          console.error('Error creating user:', err);
          return res.status(500).send({ success: false, message: '创建用户失败' });
        }
        const newUser = {
          id: result.insertId,
          username: phone,
          name: 'New User',
          email: defaultEmail,
          phone: phone
        };
        res.send({ success: true, user: newUser });
      });
    }
  });
});

// 监听端口
const port = 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

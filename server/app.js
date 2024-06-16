// app.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const axios = require('axios');

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

// 监听端口
const port = 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// app.js
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const axios = require("axios");
const bcrypt = require("bcrypt");

const app = express();
app.use(bodyParser.json());

console.log("Database Host:", process.env.DB_HOST);
console.log("App ID:", process.env.WX_APPID);
console.log("App Secret:", process.env.WX_SECRET);

// 使用环境变量来配置数据库连接
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) throw err;
  console.log("Database connected!");
});

// 微信登录API
app.post("/api/wechat-login", async (req, res) => {
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
          id: response.data.openid, // 示例，实际应用时应有更复杂的用户识别逻辑
          avatarUrl: "", // 你可以添加更多的用户信息
          nickName: "",
        },
        session_key: response.data.session_key,
      });
    } else {
      res.send({ success: false, message: "微信登录失败" });
    }
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "服务器错误", error: error.message });
  }
});

// 登录或注册API
app.post("/api/login", (req, res) => {
  const { phone, password } = req.body;
  const sqlFindUser = "SELECT * FROM users WHERE phone = ?";
  db.query(sqlFindUser, [phone], async (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res
        .status(500)
        .send({ success: false, message: "数据库查询错误" });
    }
    if (results.length > 0) {
      // 用户存在，验证密码
      const user = results[0];
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (passwordMatch) {
        const { password, ...userInfo } = user; // 剔除密码信息
        res.send({ success: true, user: userInfo });
      } else {
        res.send({ success: false, message: "密码错误" });
      }
    } else {
      // 用户不存在，创建新用户
      const hashedPassword = await bcrypt.hash(password, 10); // 加密密码
      const defaultMealTime = "08:00:00"; // 设置默认餐饮时间为早上8点，按需要调整
      const sqlCreateUser = `
        INSERT INTO users 
        (username, name, email, phone, password, breakfast_time, lunch_time, dinner_time) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      const defaultEmail = `default@example.com`; // 示例邮箱，应调整为适当的值或从请求中获取
      db.query(
        sqlCreateUser,
        [
          phone,
          "New User",
          defaultEmail,
          phone,
          hashedPassword,
          defaultMealTime,
          defaultMealTime,
          defaultMealTime,
        ],
        (err, result) => {
          if (err) {
            console.error("Error creating user:", err);
            return res
              .status(500)
              .send({ success: false, message: "创建用户失败" });
          }
          const newUser = {
            id: result.insertId,
            username: phone,
            name: phone,
            email: defaultEmail,
            phone: phone,
            breakfast_time: defaultMealTime,
            lunch_time: defaultMealTime,
            dinner_time: defaultMealTime,
          };
          res.send({ success: true, user: newUser });
        }
      );
    }
  });
});

// 更新用户信息API
app.post("/api/updateUserInfo", (req, res) => {
  const {
    id,
    username,
    name,
    email,
    phone,
    breakfast_time,
    lunch_time,
    dinner_time,
  } = req.body;

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

  db.query(
    sql,
    [username, name, email, phone, breakfast_time, lunch_time, dinner_time, id],
    (err, result) => {
      if (err) {
        console.error("Failed to update user info:", err);
        res.status(500).send({
          success: false,
          message: "Failed to update user information.",
        });
      } else {
        console.log("Updated user info successfully.");
        res.send({
          success: true,
          message: "User information updated successfully.",
        });
      }
    }
  );
});

// 重置密码API
app.post("/api/changePassword", (req, res) => {
  const { phone, oldPassword, newPassword } = req.body;

  // 根据手机号找到用户
  const sqlFindUser = "SELECT * FROM users WHERE phone = ?";
  db.query(sqlFindUser, [phone], async (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res
        .status(500)
        .send({ success: false, message: "数据库查询错误" });
    }
    if (results.length > 0) {
      const user = results[0];
      const passwordMatch = await bcrypt.compare(oldPassword, user.password);
      if (passwordMatch) {
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        const sqlUpdatePassword =
          "UPDATE users SET password = ? WHERE phone = ?";
        db.query(
          sqlUpdatePassword,
          [hashedNewPassword, phone],
          (err, result) => {
            if (err) {
              console.error("Failed to update password:", err);
              return res
                .status(500)
                .send({ success: false, message: "密码更新失败" });
            }
            res.send({ success: true, message: "密码更新成功" });
          }
        );
      } else {
        res.send({ success: false, message: "旧密码不正确" });
      }
    } else {
      res.status(404).send({ success: false, message: "用户不存在" });
    }
  });
});

//忘记密码api
app.post("/api/resetPassword", (req, res) => {
  const { name, phone, newPassword } = req.body;
  const hashedPassword = bcrypt.hashSync(newPassword, 10); // 对新密码进行加密

  // 验证用户信息
  const sql = "SELECT * FROM users WHERE name = ? AND phone = ?";
  db.query(sql, [name, phone], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).send({ success: false, message: "数据库错误" });
    }
    if (results.length > 0) {
      // 用户验证成功，更新密码
      const updateSql = "UPDATE users SET password = ? WHERE phone = ?";
      db.query(updateSql, [hashedPassword, phone], (err, result) => {
        if (err) {
          console.error("Failed to update password:", err);
          return res
            .status(500)
            .send({ success: false, message: "密码更新失败" });
        }
        res.send({ success: true, message: "密码已重置" });
      });
    } else {
      res.status(404).send({ success: false, message: "用户不存在" });
    }
  });
});

// 搜索药品信息
app.get("/api/search/drugs", (req, res) => {
  const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  db.connect((err) => {
    if (err) {
      console.error("Database connection error:", err);
      return res
        .status(500)
        .send({ success: false, message: "数据库连接失败" });
    }

    const { keyword } = req.query;
    const searchKeyword = `%${keyword}%`;
    const sqlSearchDrug =
      "SELECT * FROM drug_info WHERE name LIKE ? OR description LIKE ?";

    db.query(sqlSearchDrug, [searchKeyword, searchKeyword], (err, results) => {
      db.end(); // 关闭数据库连接
      if (err) {
        console.error("Database query error:", err);
        return res
          .status(500)
          .send({ success: false, message: "数据库查询错误" });
      }
      res.send({ success: true, drugs: results });
    });
  });
});

app.get("/api/search/nearby-stores", async (req, res) => {
  const { latitude, longitude } = req.query;
  if (!latitude || !longitude) {
    return res
      .status(400)
      .send({ success: false, message: "需要提供经纬度信息" });
  }
  const radius = 1000; // 搜索半径为1000米
  const url = `https://apis.map.qq.com/ws/place/v1/search?boundary=nearby(${latitude},${longitude},${radius})&keyword=药店&key=7DQBZ-FW53Q-NZX5T-2IBD6-WOSMZ-ORFZG`;

  try {
    const response = await axios.get(url);
    if (response.data.status === 0) {
      res.send({
        success: true,
        stores: response.data.data.map((store) => ({
          id: store.id,
          title: store.title,
          location: store.location,
        })),
      });
    } else {
      res.send({
        success: false,
        message: "地图服务请求失败",
        detail: response.data.message,
      });
    }
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "服务器错误", error: error.message });
  }
});

//加载药单
app.get("/api/medications", (req, res) => {
  const phone = req.query.phone;
  if (!phone) {
    return res
      .status(400)
      .send({ success: false, message: "Phone number is required." });
  }

  // 首先根据电话号码查询用户ID
  const findUserId = "SELECT id FROM users WHERE phone = ?";
  db.query(findUserId, [phone], (err, userResults) => {
    if (err) {
      console.error("Database query error:", err);
      return res
        .status(500)
        .send({ success: false, message: "Database query error" });
    }
    if (userResults.length === 0) {
      return res
        .status(404)
        .send({ success: false, message: "User not found" });
    }

    const userId = userResults[0].id;

    // 查询用户的所有药单
    const sql = "SELECT * FROM medications WHERE user_id = ?";
    db.query(sql, [userId], (err, medsResults) => {
      if (err) {
        console.error("Failed to retrieve medications:", err);
        return res
          .status(500)
          .send({ success: false, message: "Failed to retrieve medications" });
      }
      res.send({ success: true, medications: medsResults });
    });
  });
});

// 读取药物信息API
app.get("/api/drug-info", (req, res) => {
  const sql = "SELECT id, name, dosage, frequency_per_day FROM drug_info";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Failed to retrieve drug information:", err);
      return res.status(500).send({
        success: false,
        message: "Failed to retrieve drug information",
      });
    }
    res.send({ success: true, drugInfos: results });
  });
});

// PUT /api/medications/:id - 更新指定的药单
app.put("/api/medications/:id", (req, res) => {
  const { name, dosage, frequency, start_date, end_date, notes, taken_today } = req.body;
  const medicationId = req.params.id;

  if (!medicationId) {
    return res.status(400).send({ success: false, message: "Medication ID is required." });
  }

  const today = new Date();
  const nextDoseDay = calculateNextDoseDay(frequency, taken_today, today, end_date);

  const sql = `
    UPDATE medications
    SET name = ?, dosage = ?, frequency = ?, start_date = ?, end_date = ?, notes = ?, taken_today = ?, next_dose_date = ?
    WHERE id = ?`;

  db.query(sql, [
    name,
    dosage,
    frequency,
    start_date,
    end_date,
    notes,
    taken_today,
    nextDoseDay, // Updated next dose date
    medicationId
  ], (err, result) => {
    if (err) {
      console.error("Failed to update medication:", err);
      return res.status(500).send({ success: false, message: "Failed to update medication" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).send({ success: false, message: "Medication not found" });
    }
    res.send({ success: true, message: "Medication updated successfully" });
  });
});

// DELETE /api/medications/:id - 删除指定的药单
app.delete("/api/medications/:id", (req, res) => {
  const medicationId = req.params.id;

  if (!medicationId) {
    return res
      .status(400)
      .send({ success: false, message: "Medication ID is required." });
  }

  const sql = "DELETE FROM medications WHERE id = ?";

  db.query(sql, [medicationId], (err, result) => {
    if (err) {
      console.error("Failed to delete medication:", err);
      return res
        .status(500)
        .send({ success: false, message: "Failed to delete medication" });
    }
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .send({ success: false, message: "Medication not found" });
    }
    res.send({ success: true, message: "Medication deleted successfully" });
  });
});

// POST /api/medications - 创建新的药单
app.post("/api/medications", (req, res) => {
  const { phone, name, dosage, frequency, start_date, end_date, notes, taken_today } = req.body;

  // 检查必要信息
  if (!phone || !name) {
    return res.status(400).send({ success: false, message: "Phone and Name are required." });
  }

  // 先根据电话号码查询用户ID
  const findUserId = "SELECT id FROM users WHERE phone = ?";
  db.query(findUserId, [phone], (err, userResults) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send({ success: false, message: "Database query error" });
    }
    if (userResults.length === 0) {
      return res.status(404).send({ success: false, message: "User not found" });
    }

    const userId = userResults[0].id; // 获取用户ID
    const today = new Date();
    const nextDoseDay = calculateNextDoseDay(frequency, taken_today, today, end_date);

    // 插入新的药单记录
    const sql = "INSERT INTO medications (user_id, name, dosage, frequency, start_date, end_date, notes, taken_today, next_dose_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [userId, name, dosage, frequency, start_date, end_date, notes, taken_today, nextDoseDay], (err, result) => {
      if (err) {
        console.error("Failed to create a new medication:", err);
        return res.status(500).send({ success: false, message: "Failed to create a new medication" });
      }

      // 药单创建成功后，插入对应的提醒记录
      const medicationId = result.insertId;
      const insertReminder = "INSERT INTO reminders (user_id, medication_id) VALUES (?, ?)";
      db.query(insertReminder, [userId, medicationId], (err, reminderResult) => {
        if (err) {
          console.error("Failed to create a new reminder:", err);
          return res.status(500).send({ success: false, message: "Failed to create a new reminder" });
        }
        res.send({
          success: true,
          message: "Medication and reminder created successfully",
          medicationId: medicationId
        });
      });
    });
  });
});

function calculateNextDoseDay(frequency, taken_today, today, end_date) {
  let nextDoseDay = new Date(today);
  if (frequency - taken_today <= 0) {
    nextDoseDay.setDate(nextDoseDay.getDate() + 1); // Move to next day
  }

  // Adjust for end_date if necessary
  if (end_date && nextDoseDay > new Date(end_date)) {
    nextDoseDay = new Date(end_date);
  }

  // Format date as YYYY-MM-DD
  return `${nextDoseDay.getFullYear()}-${(nextDoseDay.getMonth() + 1).toString().padStart(2, '0')}-${nextDoseDay.getDate().toString().padStart(2, '0')}`;
}

// 获取当天药品API
app.get("/api/medications/today", (req, res) => {
  const phone = req.query.phone; // 从请求中获取电话号码

  if (!phone) {
    return res.status(400).send({ success: false, message: "Phone number is required." });
  }

  // 首先根据电话号码查询用户ID
  const findUserId = 'SELECT id FROM users WHERE phone = ?';
  db.query(findUserId, [phone], (err, userResults) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).send({ success: false, message: 'Database query error' });
    }
    if (userResults.length === 0) {
      return res.status(404).send({ success: false, message: 'User not found' });
    }

    const userId = userResults[0].id;

    // 根据用户ID和当天日期查询药物信息
    const today = new Date();
    const dateString = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    const sql = "SELECT id, name, dosage, frequency, notes, taken_today, next_dose_date FROM medications WHERE user_id = ? AND next_dose_date = ?";
    
    db.query(sql, [userId, dateString], (err, medsResults) => {
      if (err) {
        console.error('Failed to retrieve medications:', err);
        return res.status(500).send({ success: false, message: 'Failed to retrieve medications' });
      }
      res.send({ success: true, medications: medsResults });
    });
  });
});

// 获取用户三餐时间API
app.get("/api/user-meal-times", (req, res) => {
  const phone = req.query.phone; // 从查询参数中获取电话号码

  if (!phone) {
    return res.status(400).send({ success: false, message: "Phone number is required." });
  }

  const sql = "SELECT breakfast_time, lunch_time, dinner_time FROM users WHERE phone = ?";
  
  db.query(sql, [phone], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send({ success: false, message: "Database query error" });
    }

    if (results.length === 0) {
      return res.status(404).send({ success: false, message: "User not found" });
    }

    // 假设我们总是找到恰好一个用户记录
    const userMealTimes = results[0];
    res.send({ success: true, userMealTimes });
  });
});

// POST /api/medications/update-next-dose - 检查并更新next_dose_date和重置taken_today
app.post("/api/medications/update-next-dose", (req, res) => {
  const { phone } = req.body;
  const today = new Date();
  const dateString = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

  // 查询用户ID
  const userIdQuery = "SELECT id FROM users WHERE phone = ?";
  db.query(userIdQuery, [phone], (err, userResults) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send({ success: false, message: "Database query error" });
    }
    if (userResults.length === 0) {
      return res.status(404).send({ success: false, message: "User not found" });
    }
    const userId = userResults[0].id;

    // 先查询是否需要更新
    const checkUpdateSql = "SELECT id FROM medications WHERE user_id = ? AND next_dose_date < ? AND next_dose_date < end_date";
    db.query(checkUpdateSql, [userId, dateString], (err, medsToUpdate) => {
      if (err) {
        console.error("Failed to check medications:", err);
        return res.status(500).send({ success: false, message: "Failed to check medications" });
      }

      if (medsToUpdate.length > 0) {
        // 执行更新
        const updateSql = `
          UPDATE medications
          SET next_dose_date = DATE_ADD(next_dose_date, INTERVAL 1 DAY),
              taken_today = 0
          WHERE id IN (?)`;

        const medsIds = medsToUpdate.map(med => med.id);
        db.query(updateSql, [medsIds], (err, result) => {
          if (err) {
            console.error("Failed to update next_dose_date:", err);
            return res.status(500).send({ success: false, message: "Failed to update next_dose_date" });
          }
          res.send({ success: true, message: "Next dose dates and taken_today updated successfully" });
        });
      } else {
        res.send({ success: true, message: "No medications need updating" });
      }
    });
  });
});

// 监听端口
const port = 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

const nodemailer = require('nodemailer');
const User = require('../models/User');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const getAdminEmail = async () => {
  const admin = await User.findOne({ role: 'admin', email: { $ne: '' } });
  return admin?.email || process.env.ADMIN_EMAIL;
};

const sendOrderNotification = async (order, user) => {
  const adminEmail = await getAdminEmail();
  if (!adminEmail) {
    console.log('No admin email configured, skipping notification');
    return;
  }

  const itemsList = order.items.map(item =>
    `- ${item.name} x ${item.quantity} (${item.points} 积分)`
  ).join('\n');

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: adminEmail,
    subject: `新订单通知 - 订单号: ${order._id}`,
    text: `
收到新订单！

订单信息：
订单号: ${order._id}
下单时间: ${new Date(order.createdAt).toLocaleString('zh-CN')}

用户信息：
用户名: ${user.username}

收件信息：
收件人: ${order.recipient}
手机号: ${order.phone}
地址: ${order.address}

商品清单：
${itemsList}

总积分: ${order.totalPoints}

请及时处理发货！
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Order notification email sent');
  } catch (error) {
    console.error('Failed to send email:', error.message);
  }
};

module.exports = { sendOrderNotification };

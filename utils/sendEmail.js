import nodemailer from "nodemailer";

const sendEmail = async (email, token, type = "token") => {
  let transporter = nodemailer.createTransport({
    host: "smtp.mail.ru",
    port: 465,
    secure: true, // true для 465 порта, false для других портов
    auth: {
      user: process.env.SMTP_LOGIN,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const title =
    type === "token"
      ? "Secret Santa - восстановление пароля"
      : "Secret Santa - проведена жеребьевка";

  transporter.verify(function (error, success) {
    if (error) {
      console.log(error);
    } else {
      transporter
        .sendMail({
          from: process.env.SMTP_EMAIL,
          to: email,
          subject: title,
          html: createMarkup(token, type),
        })
        .catch((err) => console.log("Ошибка отправления письма", err));
    }
  });
};

function createMarkup(token, type) {
  return type === "token"
    ? `
  <div style="max-width: 600px; margin: 20px auto; padding: 20px; background-color: #f4f4f4; border-radius: 10px; box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.1);">
  <div style="font-family: Arial, sans-serif; color: #333;">
    <div style="font-size: 20px; font-weight: bold; margin-bottom: 20px;">Для восстановления пароля перейдите по ссылке:</div>
    <a href="${process.env.BASE_URL}/setNewPassword?token=${token}" style="display: inline-block; padding: 15px 25px; text-decoration: none; background-color: #6b9dbb; color: #fff; border-radius: 5px;">Восстановить пароль</a>
  </div>
</div>
`
    : `  <div style="max-width: 600px; margin: 20px auto; padding: 20px; background-color: #f4f4f4; border-radius: 10px; box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.1);">
<div style="font-family: Arial, sans-serif; color: #333;">
  <div style="font-size: 20px; font-weight: bold; margin-bottom: 20px;">Поздравляем, Вы - тайный санта :) подробности по ссылке:</div>
  <a href="${process.env.BASE_URL}/session/${token}" style="display: inline-block; padding: 15px 25px; text-decoration: none; background-color: #6b9dbb; color: #fff; border-radius: 5px;">Перейти в приложение</a>
</div>
</div>`;
}
export default sendEmail;

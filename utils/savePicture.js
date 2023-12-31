import fs from "fs";
import path from "path";

export default async function savePicture(req, file, cb, type) {
  let id;
  let directory;
  switch (type) {
    case "avatar":
      id = req.userId;
      directory = `uploads/avatars`;
      break;
    case "session":
      id = req.params.sessionId;
      directory = `uploads/sessions`;
      break;
    case "card":
      id = req.params.cardId;
      directory = `uploads/cards/${req.query.sessionId}`;
      break;
    default:
      break;
  }

  const name = `${type}-${id}${path.extname(file.originalname)}`;
  new Promise((res, rej) => {
    fs.readdir(directory, (err, files) => {
      if (err) {
        console.error("Ошибка при чтении директории:", err);
        rej();
      }

      res(
        files.forEach((file) => {
          const filePath = path.join(directory, "/", file);

          // Проверка наличия требуемой подстроки в имени файла
          if (file.includes(`${type}-${id}`)) {
            // Удаление файла
            fs.unlink(filePath, (err) => {
              if (err) {
                console.error("Ошибка при удалении файла:", err);
                rej();
              }
              console.log(`Файл ${file} успешно удален.`);
            });
          }
        })
      );
    });
  })
    .then(() => {
      req.pictureName = name;
      cb(null, name);
    })
    .catch(() => console.log(`Ошибка при удалении файла`));
}

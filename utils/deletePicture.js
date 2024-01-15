import fs from "fs";
import path from "path";

export default function deletePicture(type) {
  return function (req, response, next) {
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
      default:
        break;
    }

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
                  response
                    .status(404)
                    .json({message: "Ошибка при удалении файла:"});
                }
                console.log(`Файл ${file} успешно удален.`);
              });
            }
          })
        );
      });
    })
      .then(() => {
        req.pictureName = null;
        next();
      })
      .catch(() =>
        response.status(500).json({message: "Ошибка при удалении файла:"})
      );
  };
}

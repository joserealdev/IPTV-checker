import fs from "fs";
import fetch from "node-fetch";

const FILE_PATH = "./list.txt";

const getUrls = () => {
  const file = fs.readFileSync(FILE_PATH, "utf8");
  if (!file) return;
  const split = file.split("\n");
  if (!split || split.length < 1) return;
  return split;
};

const normalizeUrls = (urls = [""]) => {
  return urls.map((url) => {
    const match = url.match(
      /http:\/\/(.*)\/.*?(username=[a-zA-Z0-9._@-]+&password=[a-zA-Z0-9._@-]+)/
    );
    if (!match) {
      console.log(url);
      return url;
    }
    const [, host, credentials] = match;
    return `http://${host}/get.php?${credentials}&type=m3u`;
  });
};

const downloadFile = async (url, path) => {
  const res = await fetch(url);
  const fileStream = fs.createWriteStream(path);
  return new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on("error", reject);
    fileStream.on("finish", resolve);
  });
};

const readFile = (file) => fs.readFileSync(file, "utf8");

const init = () => {
  const urls = getUrls();
  if (!urls) return;
  const normalizedUrls = normalizeUrls(urls);
  normalizedUrls.forEach(async (url, i) => {
    await downloadFile(url, "./downloads/lista" + i + ".m3u")
      .catch((e) => console.error(`url failed ${url}`))
      .then((res) => {
        const path = `./downloads/lista${i}.m3u`;
        if (!fs.existsSync(path)) return;
        const fileContent = readFile(path);
        if (!fileContent.includes("#EXTINF")) {
          fs.unlink(path, (err) => {
            if (err) throw err;
            console.log(`${path} was deleted`);
          });
        }
      });
  });
};

init();

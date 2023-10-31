import axios from "axios";
import fs from "fs";

const FILE_PATH = "list.txt";
const OUTPUT_DIR = "downloads";

fs.readFile(FILE_PATH, "utf8", async (err, data) => {
  if (err) {
    console.error(`Error reading file ${FILE_PATH}: ${err}`);
    return;
  }

  const urls = data.split("\n");
  urls.forEach(async (urlStr, i) => {
    const formattedUrl = formatURL(urlStr);
    if (formattedUrl) {
      const filePath = `./${OUTPUT_DIR}/list${i}.m3u`;
      try {
        await downloadFile(formattedUrl, filePath);
        if (fileContainsEXTINF(filePath)) {
          console.log(`Found: ${formattedUrl}`);
        } else {
          fs.unlinkSync(filePath);
          console.log(`No content: ${formattedUrl}`);
        }
      } catch (error) {
        fs.unlinkSync(filePath);
        console.error(`Error donwloading ${formattedUrl}: ${error.message}`);
      }
    } else {
      console.log(`No valid URL: ${urlStr}`);
    }
  });
});

function formatURL(inputURL) {
  const regex =
    /http:\/\/(.*)\/.*?(username=[a-zA-Z0-9._@-]+&password=[a-zA-Z0-9._@-]+)/;

  const match = inputURL.match(regex);
  if (match) {
    const [, host, credentials] = match;
    return `http://${host}/get.php?${credentials}&type=m3u`;
  }
  return inputURL;
}

async function downloadFile(sourceURL, destFilePath) {
  const writer = fs.createWriteStream(destFilePath);

  const response = await axios({
    url: sourceURL,
    method: "GET",
    responseType: "stream",
    timeout: 10000,
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

function fileContainsEXTINF(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    return fileContent.includes("#EXTINF");
  } catch (err) {
    console.error(`Error reading file ${filePath}: ${err}`);
    return false;
  }
}

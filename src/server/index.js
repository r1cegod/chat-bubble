const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const sseHub = require("./sse_hub");
const {
    getLiveChatId,
    startChatStream
} = require("./adapter");


//prepare config
function requireEnvironment(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`
    );
  }

  console.log(`${name} loaded`)
  return value;
}
const config = {
  youtubeApiKey: requireEnvironment(
    "YOUTUBE_API_KEY"
  ),

  youtubeVideoId: requireEnvironment(
    "YOUTUBE_VIDEO_ID"
  )
};

//// Adapter setup
async function startAdapter() {
    const liveChatId = await getLiveChatId(
        config.youtubeApiKey,
        config.youtubeVideoId
    );

    console.log(`Active YouTube chat found: ${liveChatId}`);
    startChatStream(config.youtubeApiKey, liveChatId, sseHub.publish)
}
startAdapter().catch((error) => {
  console.error(
    "YouTube live chat connection failed:",
    error.message
  );

  process.exitCode = 1;
});



function isSafeFileName(fileName) {
  return (
    fileName !== "" &&
    !fileName.includes("/") &&
    !fileName.includes("\\") &&
    fileName !== "." &&
    fileName !== ".."
  );
}

//get filess
function serverFile(request, response) {
    //get the file name and safety check
    const url = new URL(
        request.url,
        `http://${request.headers.host}`
    );
    const fileName = decodeURIComponent(
        url.pathname.slice(1)
    );

    if (!isSafeFileName(fileName)) {
        response.writeHead(400);
        response.end("Invalid file name");
        return;
    }

    //build file path
    const filePath = path.join(
        __dirname,
        "message_renderer",
        fileName
    );

    //check extension and prepare content type for response
    const contentTypes = {
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".png": "image/png",
        ".gif": "image/gif",
        ".svg": "image/svg+xml"
    };

    const extension = path.extname(filePath).toLocaleLowerCase();
    const contentType = contentTypes[extension] ?? "application/octet-stream";

    //cache things
    const noCacheExtensions = new Set([
        ".html",
        ".css",
        ".js"
    ]);
    const cacheControl = noCacheExtensions.has(extension)
    ? "no-cache"
    : "public, max-age=18000";

    //now read
    fs.readFile(filePath, (error, contents) => {
        if (!error) {
            response.writeHead(200, {
                "Content-Type": contentType,
                "Cache-Control": cacheControl
            });
            response.end(contents);
            return;
        }
        if (error.code === "ENOENT") {
            response.writeHead(404);
            response.end("404 not found")
            return;
        }
        if (error.code === "EISDIR") {
            response.writeHead(404);
            response.end("404 not found")
            return;
        }
        if (error.code === "EACCES") {
            response.writeHead(404);
            response.end("404 no access")
            return;
        }
        response.writeHead(500);
        response.end("500 Internal Server Error");
    });
}

//get main html page
function serverPage(response) {
    const filePath = path.join(
        __dirname,
        "message_renderer",
        "chat_box.html"
    );

    fs.readFile(filePath, (error, fileContents) => {
        if (error) {
            response.writeHead(500, {
                "Content-Type": "text/plain"
            });
            response.end("Could not read page");
            console.log("can't read page")
            return;
        }

        response.writeHead(200, {
            "Content-Type": "text/html"
        });
        response.end(fileContents);
        console.log("page connected")
    });
}


//da server
const server = http.createServer((request, response) => {
    if (request.url === "/health") {
        response.writeHead(200, {
            "Content-Type": "application/json"
        });

        response.end(JSON.stringify({
            status: "healthy"
        }));
        return;
    }

    if (request.url === "/events") {
        sseHub.connect(response);
        return;
    }

    if (request.url === "/chat_box") {
        serverPage(response);
        return;
    }

    if (request.url) {
        serverFile(request, response);
        return;
    }

    response.writeHead(404);
    response.end("Not found");
});


server.listen(3000, "127.0.0.1");

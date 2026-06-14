const http = require("node:http");
const sseHub = require("./sse_hub");

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

    response.writeHead(404);
    response.end("Not found");
});


server.listen(3000, "127.0.0.1");
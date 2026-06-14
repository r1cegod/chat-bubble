const clients = new Set();

function connect(response) {
    response.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
    });

    clients.add(response);

    response.on("close", () => {
        clients.delete(response);
    });
}

function publish(messagePackage) {
    const json = JSON.stringify(messagePackage);
    const event = `data: ${json}\n\n`;

    for (const client of clients) {
        client.write(event);
    }
}

module.exports = {
    connect,
    publish
};
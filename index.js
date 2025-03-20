const ws = require("ws");
const { v4: uuidv4 } = require('uuid');

// const wss = new WebSocketServer({ port: 8080 });
const wss = new ws.WebSocketServer({ port: 8080 });
const rooms = {};

const parseJSON = (data) => {
    try {
        const parsedData = JSON.parse(data);

        return parsedData;
    } catch (e) {
        console.error(e);
        
        return null;
    }
};
const emitToAllUserOnRoom = (room, roomname, message) => {
    // send the message to all in the room
    if (room) {
        Object.entries(room).forEach(([, sock]) => sock.send(JSON.stringify({message: message, meta: null, room: roomname})));
    }
}

wss.on('connection', function connection(ws) {
    const uuid = uuidv4();

    const leave = room => {
        // not present: do nothing
        if (!rooms[room][uuid]) return;

        // if the one exiting is the last one, destroy the room
        if (Object.keys(rooms[room]).length === 1) {
            delete rooms[room];
            console.log("User left the room: ", room);
        } else { // otherwise simply leave the room
            delete rooms[room][uuid];
            console.log("No users left on the room '", room, "'. Room was destroyed.");
        }
    };

    ws.on('message', function message(data) {
        const json = parseJSON(data);

        if (!json) {
            return ws.send("Cannot parse message, incorrect JSON data.")
        }

        const { message, meta, room } = json;

        if (meta === "join") {
            if (!rooms[room]) rooms[room] = {}; // create the room
            if (!rooms[room][uuid]) rooms[room][uuid] = ws; // join the room
            // ws.send(JSON.stringify({ message: , meta: null, room: uuid }));
            emitToAllUserOnRoom(rooms[room], room, "User joined the room.")
            console.log("New user joined to the room: ", uuid, rooms);
        }
        else if (meta === "leave") {
            leave(room);
        }
        else if (!meta) {
            // send the message to all in the room
            if (rooms[room]) {
                console.log(rooms);
                emitToAllUserOnRoom(rooms[room], room, `User joined to the room: ${room}`);
                // Object.entries(rooms[room]).forEach(([, sock]) => sock.send({ message }));
            }
        }

        console.log('received: %s', data);
    });

    ws.send('Welcome to the server, trainer!');

    ws.on("close", () => {
        // for each room, remove the closed socket
        Object.keys(rooms).forEach(room => leave(room));
    });
});

console.log("Server Started!");

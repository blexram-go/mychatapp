let selectedChat = "general";

class Event {
    constructor(type, payload) {
        this.type = type;
        this.payload = payload;
    }
}

function routeEvent(event) {
    if (event.type == undefined) {
        alert("no type field in the event");
    }

    switch (event.type) {
        case "new_message":
            console.log("new message");
            break;
        default:
            alert("unsupported message type");
            break;
    }
}

function sendEvent(eventName, payload) {
    const event = new Event(eventName, payload);
    conn.send(JSON.stringify(event));
}

function changeChatRoom() {
    let newChat = document.getElementById("chatroom");
    if (newChat != null && newChat.value != selectedChat) {
        console.log(newChat);
    }
    return false;
}

function sendMessage() {
    let newMessage = document.getElementById("message");
    if (newMessage != null) {
        sendEvent("send_message", newMessage.value);
    }
    return false;
}

window.onload = function() {
    document.getElementById("chatroom-selection").onsubmit = changeChatRoom;
    document.getElementById("chatroom-message").onsubmit = sendMessage;

    if (window["WebSocket"]) {
        console.log("supports websockets");
        // Connect to WS
        conn = new WebSocket("ws://" + document.location.host + "/ws");

        conn.onmessage = function(e) {
            const eventData = JSON.parse(e.data);

            const event = Object.assign(new Event, eventData);

            routeEvent(event);
        }
    } else {
        alert("Browser does not support websockets!");
    }
}
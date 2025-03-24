let selectedChat = "general";

class Event {
    constructor(type, payload) {
        this.type = type;
        this.payload = payload;
    }
}

class SendMessageEvent {
    constructor(message, from) {
        this.message = message;
        this.from = from;
    }
}

class NewMessageEvent {
    constructor(message, from, sent) {
        this.message = message;
        this.from = from;
        this.sent = sent;
    }
}

function routeEvent(event) {
    if (event.type == undefined) {
        alert("no type field in the event");
    }

    switch (event.type) {
        case "new_message":
            const messageEvent = Object.assign(new NewMessageEvent, event.payload)
            appendChatMessage(messageEvent)
            break;
        default:
            alert("unsupported message type");
            break;
    }
}

function appendChatMessage(messageEvent) {
    let date = new Date(messageEvent.sent);
    const formattedMsg = `${date.toLocaleString()}: ${messageEvent.message}`;

    textarea = document.getElementById("chatmessages");
    textarea.innerHTML = textarea.innerHTML + "\n" + formattedMsg;
    textarea.scrollTop = textarea.scrollHeight;
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
        let outgoingEvent = new SendMessageEvent(newMessage.value, "brian");
        sendEvent("send_message", outgoingEvent);
    }
    newMessage.value = "";
    return false;
}

function login() {
    let formData = {
        "username": document.getElementById("username").value,
        "password": document.getElementById("password").value
    }

    fetch("login", {
        method: 'post',
        body: JSON.stringify(formData),
        mode: 'cors',
    }).then((response) => {
        if (response.ok) {
            return response.json();
        } else {
            throw 'unauthorized';
        }
    }).then((data) => {
        // We are authenticated
        connectWebsocket(data.otp);

        document.getElementById("username").value = '';
        document.getElementById("password").value = '';
    }).catch((e) => { alert(e) });

    return false;
}

function connectWebsocket(otp) {
    if (window["WebSocket"]) {
        console.log("supports websockets");
        // Connect to WS
        conn = new WebSocket("ws://" + document.location.host + "/ws?otp=" + otp);

        // Onopen
        conn.onopen = function(e) {
            document.getElementById("connection-header").innerHTML = "Connected to Websocket: true";
        }

        // Onclose
        conn.onclose = function(e) {
            document.getElementById("connection-header").innerHTML = "Connected to Websocket: false";
        }
        
        conn.onmessage = function(e) {
            const eventData = JSON.parse(e.data);

            const event = Object.assign(new Event, eventData);

            routeEvent(event);
        }
    } else {
        alert("Browser does not support websockets!");
    }
}

window.onload = function() {
    document.getElementById("chatroom-selection").onsubmit = changeChatRoom;
    document.getElementById("chatroom-message").onsubmit = sendMessage;
    document.getElementById("login-form").onsubmit = login;  
};
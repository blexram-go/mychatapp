let selectedChat = "general";

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
        console.log(newMessage);
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
    } else {
        alert("Browser does not support websockets!");
    }
}
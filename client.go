package main

import (
	"encoding/json"
	"log"

	"github.com/gorilla/websocket"
)

type ClientList map[*Client]bool

type Client struct {
	wsConn *websocket.Conn
	mgr    *Manager

	// egress is used to avoid concurrent writes on the websocket connection
	egress chan Event
}

func NewClient(conn *websocket.Conn, manager *Manager) *Client {
	return &Client{
		wsConn: conn,
		mgr:    manager,
		egress: make(chan Event),
	}
}

func (c *Client) readMessages() {
	defer func() {
		// Cleanup connection gracefully
		c.mgr.removeClient(c)
	}()

	for {
		_, payload, err := c.wsConn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error reading message: %v", err)
			}
			break
		}

		// Marshal incoming data into the Event struct
		var request Event
		err = json.Unmarshal(payload, &request)
		if err != nil {
			log.Printf("error marshalling message: %v", err)
			break
		}

		// Route the event
		err = c.mgr.routeEvent(request, c)
		if err != nil {
			log.Println("Error handling message: ", err)
		}
	}
}

func (c *Client) writeMessages() {
	defer func() {
		c.mgr.removeClient(c)
	}()

	for {
		select {
		case message, ok := <-c.egress:
			if !ok {
				if err := c.wsConn.WriteMessage(websocket.CloseMessage, nil); err != nil {
					log.Println("connection closed: ", err)
				}
				return
			}
			data, err := json.Marshal(message)
			if err != nil {
				log.Println(err)
				return
			}
			// Write a regular text message to the connection
			err = c.wsConn.WriteMessage(websocket.TextMessage, data)
			if err != nil {
				log.Println(err)
			}
			log.Println("message sent")
		}
	}
}

package main

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

var (
	pongWait     = 10 * time.Second
	pingInterval = (pongWait * 9) / 10
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

	// Set Max Size of Messages in Bytes
	c.wsConn.SetReadLimit(512)

	err := c.wsConn.SetReadDeadline(time.Now().Add(pongWait))
	if err != nil {
		log.Println(err)
		return
	}

	c.wsConn.SetPongHandler(c.pongHandler)

	for {
		_, payload, err := c.wsConn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error reading message: %v", err)
			}
			break
		}

		// Marshal incoming data into the Event struct
		request := Event{}
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

	ticker := time.NewTicker(pingInterval)

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
		case <-ticker.C:
			log.Println("ping")
			// Send a Ping to the Client
			err := c.wsConn.WriteMessage(websocket.PingMessage, []byte{})
			if err != nil {
				log.Println("writemsg err: ", err)
				return
			}
		}
	}
}

func (c *Client) pongHandler(pongMsg string) error {
	log.Println("pong")
	return c.wsConn.SetReadDeadline(time.Now().Add(pongWait))
}

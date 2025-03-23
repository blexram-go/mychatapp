package main

import "github.com/gorilla/websocket"

type ClientList map[*Client]bool

type Client struct {
	wsConn *websocket.Conn
	mgr    *Manager
}

func NewClient(conn *websocket.Conn, manager *Manager) *Client {
	return &Client{
		wsConn: conn,
		mgr:    manager,
	}
}

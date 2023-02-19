let WebSocketServer = require("ws").WebSocketServer
let wss = new WebSocketServer({ port: 8886 })

let userConnections = {}
let userDetails = new Map()

let userInfo = []

function sendTo(conn, message) {
  conn.send(JSON.stringify(message));
}

wss.on('listening', () => {
  console.log("Server Started...")
})

wss.on('connection', connection => {
  connection.on('message', message => {
    if(message.toString() === "client_ping") {
      sendTo(connection, { type: "server_pong", name: "pong" })
    } else {
      let data = null
      try{
        data = JSON.parse(message)
      } catch (e) {
        console.error("message should be JSON Format Except Ping")
      }

      if(data) {
        switch (data.type) {
          case "login":
            if(data.name in userConnections) {
              sendTo(connection, { type: "server_login", success: false })
              console.log("login Failed")
            } else {
              for(let conn in userConnections) {
                sendTo(userConnections[conn], { type: "someone_login", name: data.name })
              }

              userConnections[data.name] = connection;
              connection.name = data.name;
              connection.otherName = null;

              userDetails.set(data.name, 'online')

              sendTo(connection, { type: "server_login", success: true })
            }
            break
          case "load_user":
            userInfo= []
            userDetails.forEach((value, key) => userInfo.push({
              name: key,
              state: value
            }))
            sendTo(connection, { type: "user_list", list: userInfo })
            break
          case "want_to_call":
            let conn = userConnections[data.name]
            if(conn) {
              if((conn.otherName != null) || userDetails.get(data.name) === "busy") {
                sendTo(connection, { type: "user_chatting_available", status: false, name: data.name });
              } else {
                userInfo= []
                userDetails.set(data.name, "busy")
                userDetails.set(connection.name, "busy")
                userDetails.forEach((value, key) => userInfo.push({
                  name: key,
                  state: value
                }))

                for(let name in userConnections) {
                  sendTo(userConnections[name], { type: "user_list", list: userInfo })
                }

                sendTo(connection, { type: "user_list", list: userInfo })
                sendTo(conn, { type: "user_list", list: userInfo })

                sendTo(connection, { type: "user_chatting_available", status: true, name: data.name });
              }
            } else {
              sendTo(connection, { type: "server_no_user", status: false });
            }
            break
          case "candidate":
            let candidateConnection = userConnections[data.name];
            if (candidateConnection != null) {
              /* Send candidate details to user */
              if(candidateConnection.otherName != null)
              {
                sendTo(candidateConnection, { type: "server_candidate", candidate: data.candidate });
              }
            }
            break;
          case "offer":
            if (data.name in userConnections) {
              /* Get the peer connection from array */
              let conn = userConnections[data.name];
              if (conn == null) {
                /* Error handling */
                console.log("connection is null..");
                sendTo(connection, { type: "server_no_user", success: false });
              }
              else if (conn.otherName == null) {
                /* When user is free and availble for the offer */
                /* Send the offer to peer user */
                sendTo(conn, { type: "server_offer", offer: data.offer, name: connection.name, success: false });
              }
              else {
                /* User has in the room, User is can't accept the offer */
                sendTo(connection, { type: "server_already_in_room", success: false, name: data.name });
              }
            }
            else {
              /* Error handling with invalid query */
              sendTo(connection, { type: "server_nouser", success: false });
            }
            break;
          case "answer":
            /* Get the peer user connection details */

            let userConnection = userConnections[data.name];

            if (userConnection != null) {
              /* Send the answer back to requested user */
              sendTo(userConnection, {type: "server_answer", answer: data.answer});
            }
            break;
          case "ready":
            let conn2 = userConnections[data.name];
            if (conn2 != null) {
              /* Update the user status with peer name*/
              connection.otherName = data.name;
              conn2.otherName = connection.name;
              /* Send response to each users */
              sendTo(conn2, { type: "server_user_ready", success: true, peerName: connection.name });
              sendTo(connection, { type: "server_user_ready", success: true, peerName: conn2.name });
            }
            break;
          case "chatting_reject":
            let reject_conn = userConnections[data.name]

            if (reject_conn !== null) {
              userInfo= []
              userDetails.set(data.name, "online")
              userDetails.set(connection.name, "online")
              userDetails.forEach((value, key) => userInfo.push({
                name: key,
                state: value
              }))
              for(let name in userConnections) {
                sendTo(userConnections[name], { type: "user_list", list: userInfo })
              }

              sendTo(reject_conn, {type: "target_rejected"})
            }
            break
          case "leave":
            let leave_conn = userConnections[data.name]

            if(leave_conn !== null) {
              sendTo(leave_conn, {
                type: "server_user_leave",
              })

              sendTo(connection, {
                type: "server_user_leave",
              })

              userInfo= []
              userDetails.set(data.name, 'online')
              userDetails.set(connection.name, 'online')
              userDetails.forEach((value, key) => userInfo.push({
                name: key,
                state: value
              }))
              for(let name in userConnections) {
                sendTo(userConnections[name], { type: "user_list", list: userInfo })
              }

              leave_conn.otherName = null
              connection.otherName = null

              console.log("end room")
            }
            break
        }
      }
    }
  })
})
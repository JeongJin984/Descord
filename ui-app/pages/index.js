import AppLayOut from "../components/AppLayOut/AppLayOut";
import {Header, Icon, Loader} from "semantic-ui-react";
import {Accordion, Form, Image, Modal, Row} from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import Button from "react-bootstrap/Button";
import { useState } from "react";
import useWebSocket from 'react-use-websocket'
import ReactPlayer from "react-player/lazy";

export let peerConnection = null
export let sendingDataChannel = null
export let receivingDataChannel = null

export let current_client_stream = null
export let current_peer_stream = null

export default () => {
  const dispatch = useDispatch()

  const {
    flagSendDatachannel,
    isLoginSucceed,
    isChattingOn,
    text_chats,
    chatRequestModal,
    waitingAnswerModal,
    connectedToChatUser
  } = useSelector(state => state.userReducer)

  const [socketUrl, setSocketUrl] = useState('ws://localhost:8886');
  const [socketServerState, setSocketServerState] = useState("")
  const [connectionOffer, setConnectionOffer] = useState(null)
  const [connectionAnswer, setConnectionAnswer] = useState(null)
  const [peerVideoStream, setPeerVideoStream] = useState(null)
  const [clientVideoStream, setClientVideoStream] = useState(null)

  const {
    sendMessage,
    sendJsonMessage,
    lastMessage,
    lastJsonMessage,
    readyState,
    getWebSocket,
  } = useWebSocket(socketUrl, {
    onOpen: () => {
      console.log("ping send!!!")
      sendMessage("client_ping")
      setSocketServerState("Server is ACTIVE!!!!")
    },
    //Will attempt to reconnect on all close events, such as server shutting down
    shouldReconnect: (closeEvent) => true,
    onMessage: (event) => {
      let data = JSON.parse(event.data)
      switch (data.type) {
        case "server_pong":
          if (data.name === "pong") {
            console.log("pong!!!")
          }
          break;
        case "server_login":
          if(data.success) {
            dispatch({
              type: "LOGIN_SUCCESS"
            })

            sendJsonMessage({
              type: "load_user"
            })
          } else {
            alert("Username is already taken .. choose different one");
          }
          break
        case "user_list":
          dispatch({
            type: "LOAD_USER_LIST",
            data: data.list
          })
          break
        case "someone_login":
          dispatch({
            type: "UPDATE_ONLINE_USER",
            data: data.name
          })
          break
        case "user_chatting_available":
          if(data.status) {
            dispatch({
              type: "CHAT_REQUEST_MODAL",
              data: true
            })

            create_webrtc_initial_connection(false, data.name)
              .then(r => console.log("init rtc connection!!!!"))
          }
          break
        case "server_candidate":
          console.log("onCandidate => candidate = "+ data.candidate);
          peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
            .then(r => console.log("ICE Candidate added"))
            .catch(error => console.error(error))
          break;
        case "server_offer":
          console.log("somebody wants to call us  => offer = "+ data.offer);
          setConnectionOffer(data.offer)
          dispatch({
            type: "INIT_CONNECTED_CHAT_USER",
            user: data.name
          })
          /*create a popup to accept/reject room request*/
          dispatch({
            type: "CHAT_ANSWER_MODAL",
            data: true
          })
          break
        case "server_answer":
          console.log("when another user answers to  offer => answer = "+ data.answer);
          peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer))
            .then(r => console.log("set remote description set!!!, ", r))
            .catch(error => console.error("setting remote description failed, ", error))
          sendJsonMessage({
            type: "ready",
            name: connectedToChatUser
          })
          break
        case "server_user_ready":
          if (data.success) {
            //clear all dynamic datas
            dispatch({
              type: "CHAT_REQUEST_MODAL",
              data: false
            })
            dispatch({
              type: "CHAT_ANSWER_MODAL",
              data: false
            })
            alert("Happy Chatting!")
            dispatch({
              type: "CHATTING_STATE",
              data: true
            })
          }
          break
        case "target_rejected":
          dispatch({
            type: "CHAT_REQUEST_MODAL",
            data: false
          })
          dispatch({
            type: "CHAT_ANSWER_MODAL",
            data: false
          })
          dispatch({
            type: "CHATTING_STATE",
            data: false
          })
          dispatch({
            type: "CLEAR_TEXT_CHAT"
          })
          if(flagSendDatachannel) {
            sendingDataChannel.close()
            dispatch({
              type: "FLAG_SEND_DATACHANNEL",
              data: false
            })
          } else {
            if(receivingDataChannel) {
              receivingDataChannel.close()
            }
          }
          peerConnection.close()
          peerConnection = null
          break
        case "server_user_leave":
          dispatch({
            type: "CHAT_REQUEST_MODAL",
            data: false
          })
          dispatch({
            type: "CHAT_ANSWER_MODAL",
            data: false
          })
          dispatch({
            type: "CHATTING_STATE",
            data: false
          })
          dispatch({
            type: "CLEAR_TEXT_CHAT"
          })
          if(flagSendDatachannel) {
            sendingDataChannel.close()
            dispatch({
              type: "FLAG_SEND_DATACHANNEL",
              data: false
            })
          } else {
            if(receivingDataChannel) {
              receivingDataChannel.close()
            }
          }
          peerConnection.close()
          peerConnection = null
      }
    }
  });

  async function  create_webrtc_initial_connection(channel, name) {
    const stream = await navigator.mediaDevices.getDisplayMedia({audio: true, video: true})

    peerConnection = await new RTCPeerConnection({
      "iceServers": [
        {
          "urls": "stun:stun.1.google.com:19302"
        },
        {
          urls: 'turn:192.158.29.39:3478?transport=tcp',
          credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
          username: '28224511:1379330808'
        }
      ]
    })
    //when the browser finds an ice candidate we send it to another peer
    peerConnection.onicecandidate = icecandidateAdded;
    peerConnection.oniceconnectionstatechange = handleStateChangeCallback;
    peerConnection.onnegotiationneeded = handleOnNegotiationCallback;
    peerConnection.ontrack = gotRemoteStream
    console.log("added ontrack listener!!!!!")

    setClientVideoStream(stream)

    const videoTracks = stream.getVideoTracks();
    const audioTracks = stream.getAudioTracks();

    if (videoTracks.length > 0) {
      console.log(`Using video device: ${videoTracks[0].label}`);
    }
    if (audioTracks.length > 0) {
      console.log(`Using audio device: ${audioTracks[0].label}`);
    }

    if(peerConnection) {
      stream.getTracks().forEach(track => {
        console.log("zxcvzxcv")
        peerConnection.addTrack(track, stream)
      })
    } else {
      console.error("peerConnection is null!!!!!!!!!!")
    }

    if(channel === false) {
      console.log("cacacacacacaacac")
      Create_DataChannel(name)
      await creating_offer(name)
    } else {
      console.log("dadadadadadadadad")
      createAnswer()
    }
  }

  function icecandidateAdded(ev) {
    console.log("ICE candidate = "+ ev.candidate);
    if (ev.candidate) {
      sendJsonMessage({
        type: "candidate",
        candidate: ev.candidate,
        name: connectedToChatUser
      });
    }
  }

  function handleStateChangeCallback(event) {
    /* if you want , use this function for webrtc state change event  */
    const state = peerConnection.iceConnectionState;
    if (state === "failed" || state === "closed") {
      /* handle state failed , closed */
    } else if (state === "disconnected") {
      /* handle state disconnected */
    }
  }

  function handleOnNegotiationCallback (event){
    /* if you want , use this function for handleonnegotiatioCallback  */
  }

  function gotRemoteStream(e) {
    if (peerVideoStream !== e.streams[0]) {
      setPeerVideoStream(e.streams[0])
      console.log('received remote stream..');
    }
  }

  function Create_DataChannel(name) {
    const dataChannelOptions = {
      ordered: false,             // do not guarantee order
      maxPacketLifeTime: 3000,    // in milliseconds
    };

    let channelName = "webrtc_label_" + name;
    sendingDataChannel = peerConnection.createDataChannel(channelName, dataChannelOptions)

    sendingDataChannel.onerror = onSend_ChannelErrorState;
    sendingDataChannel.onmessage = onSend_ChannelMessageCallback;
    sendingDataChannel.onopen = onSend_ChannelOpenState;
    sendingDataChannel.onclose = onSend_ChannelCloseStateChange;
  }

  function onSend_ChannelOpenState(event) {
    dispatch({
      type: "FLAG_SEND_DATACHANNEL",
      data: true
    })

    console.log("dataChannel.OnOpen", event);
    if (sendingDataChannel.readyState === "open") {
      /* */
    }``
  }
  /**
   * This function will handle the data channel message callback.
   */
  function onSend_ChannelMessageCallback(event) {
    console.log("dataChannel.OnMessage:", event);
    dispatch({
      type: "CHATTING_EVENT",
      data: event.data,
      texter: false
    })
  }
  /**
   * This function will handle the data channel error callback.
   */
  function onSend_ChannelErrorState(error) {
    console.log("dataChannel.OnError:", error);
  }
  /**
   * This function will handle the data channel close callback.
   */
  function onSend_ChannelCloseStateChange(event) {
    console.log("dataChannel.OnClose", event);
  }

  async function creating_offer(name) {
    try {
      const offer = await peerConnection.createOffer({
        iceRestart:true,
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      })
      await peerConnection.setLocalDescription(offer)

      sendJsonMessage({
        type: "offer",
        name: name,
        offer: offer
      });
    } catch (e) {
      dispatch({
        type: "PEER_CONNECTION_FAILED"
      }) /*remove modal when any error occurs */
      alert("Failed to create offer:" + e);
    }
  }

  const onSubmitLogin = (e) => {
    e.preventDefault()
    dispatch({
      type: "LOGIN_REQUEST",
      data: e.target.querySelector("#formBasicUsername").value
    })
    sendJsonMessage({
      type: "login",
      name: e.target.querySelector("#formBasicUsername").value
    })
  }

  function createAnswer() {
    peerConnection.ondatachannel = receiveChannelCallback;
    console.log("zxcvzxcvzxcvzxcv", connectionOffer)
    peerConnection.setRemoteDescription(new RTCSessionDescription(connectionOffer))
      .then(r => console.log("set remote description set!!!, "))
      .catch(error => console.error("setting description failed, ", error))

    peerConnection.createAnswer()
      .then(function (answer) {
        peerConnection.setLocalDescription(answer)
          .then(r => {
            setConnectionAnswer(answer)
            console.log("creating answer  => answer = " + peerConnection.localDescription);
          })
          .catch(error => console.error("setting description failed, ", error))

        sendJsonMessage({
          type: "answer",
          name: connectedToChatUser,
          answer: answer
        });
      })
      .catch(function (err) {
        console.log(err.name + ': ' + err.message);
        alert("answer is failed");
        // clear_incoming_modal_popup(); /*remove modal when any error occurs */
      });
  }

  const onClickAccept = (e) => {
    //create RTC peer connection from receive end
    create_webrtc_initial_connection(true, null);
    //create a data channel bind

    dispatch({
      type: "CHAT_ANSWER_MODAL",
      data: false
    })
  }

  function receiveChannelCallback(event) {
    receivingDataChannel = event.channel
    receivingDataChannel.onopen = onReceive_ChannelOpenState;
    receivingDataChannel.onmessage = onReceive_ChannelMessageCallback;
    receivingDataChannel.onerror = onReceive_ChannelErrorState;
    receivingDataChannel.onclose = onReceive_ChannelCloseStateChange;
  }

  function onReceive_ChannelOpenState(event) {
    dispatch({
      type: "FLAG_SEND_DATACHANNEL",
      data: false
    })

    dispatch({
      type: "SEND_DATACHANNEL",
      data: false
    })
    console.log("dataChannel.OnOpen", event);

    if (receivingDataChannel.readyState === "open") {
      /* */
    }
  }

  function onReceive_ChannelMessageCallback(event) {
    dispatch({
      type: "CHATTING_EVENT",
      data: event.data,
      texter: false
    })
  }

  function onReceive_ChannelErrorState(error) {
    console.log("dataChannel.OnError:", error);
  }

  function onReceive_ChannelCloseStateChange(event) {
    console.log("dataChannel.OnClose", event);
  }

  const onClickReject = () => {
    sendJsonMessage({
      type: "chatting_reject",
      name: connectedToChatUser,
    })

    dispatch({
      type: "CHAT_ANSWER_MODAL",
      data: false
    })
  }

  const onSubmitChat = (e) => {
    e.preventDefault()
    const message = e.target.querySelector("#ControlChat").value
    if(flagSendDatachannel) {
      sendingDataChannel.send(message)
    } else {
      receivingDataChannel.send(message)
    }

    dispatch({
      type: "CHATTING_EVENT",
      data: message,
      texter: true
    })
  }

  const leaveChattingRoom = () => {
    sendJsonMessage({
      type: "leave",
      name: connectedToChatUser
    })
  }

  return (
      <div>
        { !isLoginSucceed ?
            <div style={{position: "absolute", height: "100%", width: "100%", backgroundColor: "gray", textAlign: "center"}}>
              <Form onSubmit={onSubmitLogin} style={{ position: "fixed", top: "35%", left: "42%", width: "300px"}}>
                <Form.Group className="mb-3" controlId="formBasicUsername">
                  <Form.Label><h1>username</h1></Form.Label>
                  <div> &nbsp;</div>
                  <Form.Control type="text" placeholder="Enter username" />
                </Form.Group>
                <div>{socketServerState}</div>
                <div> &nbsp;</div>
                <Button letiant="primary" type="submit">
                  Submit
                </Button>
              </Form>
            </div> :
            <AppLayOut send={sendJsonMessage}>
              <Header as='h2' textAlign='center' icon >
                <span style={{color: "white"}}>Chatting Started</span>
              </Header>
              <Button variant="outline-danger" onClick={leaveChattingRoom} style={{position: "fixed", top: "48px", left: "55%",height: "37px", width: "150px", marginLeft:"20%" }}>채팅방 나가기</Button>
              {
                isChattingOn && (
                  <div style={{padding: "40px"}}>
                    <Row>
                      {
                          <div style={{float: "left", width: "50%"}}>
                            <div>client</div>
                            {
                              clientVideoStream ?
                                <ReactPlayer controls={true} url={clientVideoStream}></ReactPlayer> :
                                <div>clientVideoStream is null</div>
                            }
                            <div>peer</div>
                            {
                              peerVideoStream ?
                                <ReactPlayer controls={true} url={peerVideoStream}></ReactPlayer>:
                                <div>peerVideoStream is null</div>
                            }

                          </div>
                      }

                      <div style={{float: "right", width: "50%"}}>
                        {
                          text_chats.map((v, i) => (
                            <div key={i}>{v.data}</div>
                          ))
                        }
                      </div>
                    </Row>
                    <Form onSubmit={onSubmitChat} style={{position: "fixed", bottom: "20px", width:"58%"}}>
                      <Form.Group className="mb-3" controlId="ControlChat">
                        <Form.Control type="text" placeholder="입력하세요" />
                      </Form.Group>
                    </Form>
                  </div>
                )
              }
            </AppLayOut>}
        <Modal
          size="lg"
          show={waitingAnswerModal}
          onHide={() => dispatch({
            type: "CHAT_ANSWER_MODAL",
            data: false
          })}
          aria-labelledby="example-modal-sizes-title-sm"
        >
          <Modal.Header closeButton>
            <Modal.Title id="example-modal-sizes-title-sm">
              Small Modal
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Button disabled={connectionOffer === null} onClick={onClickAccept}>Accept</Button>
            <Button onClick={onClickReject}>Reject</Button>
          </Modal.Body>
        </Modal>
        <Modal
          size="lg"
          show={chatRequestModal}
          onHide={() => dispatch({
            type: "CHAT_REQUEST_MODAL",
            data: false
          })}
          aria-labelledby="example-modal-sizes-title-sm"
        >
          <Modal.Header closeButton>
            <Modal.Title id="example-modal-sizes-title-sm">
              Small Modal
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Loader active inline='centered' />
            <div>{"waiting!!!!"}</div>
          </Modal.Body>
        </Modal>
      </div>
  )
}

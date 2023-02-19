import {Image} from "react-bootstrap";
import {useDispatch, useSelector} from "react-redux";

export default ({isOnline, name, send}) => {
  const dispatch = useDispatch()

  const { isChattingOn } = useSelector(state => state.userReducer)

  const onClickStartChat = () => {
    if(isChattingOn) {
      alert("you are already in chatting room!!!")
    } else if(!isOnline) {
      alert("Target user is Busy!!!")
    } else {
      send({
        type: "want_to_call",
        name: name
      })
      dispatch({
        type: "INIT_CONNECTED_CHAT_USER",
        user: name
      })
    }
  }

  return (
    <div style={{cursor: "pointer"}} onClick={onClickStartChat}>
      <Image roundedCircle={true} style={{height: "40px", width: "40px", margin: "10px"}}
             src='https://i.stack.imgur.com/frlIf.png' avatar="true"/>
      <span>{name}</span>
      {
        isOnline ?
          <span style={{marginLeft: "30px", color: "green"}}>ONLINE</span>:
          <span style={{marginLeft: "28px", color: "red"}}>BUSY</span>
      }
    </div>
  )
}
import {Badge, Col, Container, Image, Nav, Row} from "react-bootstrap";
import {Divider, Button, Icon, Image as SImage} from 'semantic-ui-react'
import {useDispatch, useSelector} from "react-redux";
import UserStateAvatar from "./sub/UserStateAvatar";
import HomeButton from "./sub/HomeButton";
import UserServerButton from "./sub/UserServerButton";
import SoundControlButtons from "./sub/SoundControlButtons";
import UserInfo from "./sub/UserInfo";
import FriendNav from "./sub/FriendNav";

export default ({ children, send }) => {
  const dispatch = useDispatch()

  const {onlineUserList, loginUser} = useSelector(state => state.userReducer)

  return (
      <Container style={{margin: "0px", backgroundColor: "darkgray", backgroundSize: "cover"}} fluid={true}>
        <Row>
          <Col>
            <Row>
              <Col style={{backgroundColor: "#202225", height: "100%", width: "85px", position: "fixed"}}>
                <HomeButton/>
                <UserServerButton/>
              </Col>
              <Col style={{
                backgroundColor: "#2F3136",
                height: "100%",
                width: "250px",
                position: "fixed",
                marginLeft: "85px",
                color: "white"
              }}>
                <h2>
                  <Badge bg="secondary" style={{
                    marginTop: "20%",
                    marginBottom: "10%"
                  }}>New</Badge>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;친구
                </h2>
                {
                  onlineUserList.map((value, i) => (
                    loginUser !== value.name &&
                      <span key={i}><UserStateAvatar isOnline={value.state==="online"} name={value.name} send={send}/></span>
                  ))
                }
              </Col>
              <div style={{
                bottom: "0px",
                position: "fixed",
                width: "250px",
                height: "70px",
                backgroundColor: "#292B2F",
                marginLeft: "85px"
              }}>
                <UserInfo userInfo={{name: "Click the ...", code: "#3434", profileImage: "https://i.stack.imgur.com/frlIf.png"}}/>
                <SoundControlButtons/>
              </div>
            </Row>
          </Col>
          <Col style={{position: "fixed", marginLeft: "335px"}}>
            <Row style={{backgroundColor: "#36393F", height: "50px"}}>
                <FriendNav/>
            </Row>
            <Row>
              <div style={{position: "fixed", height: "100%", backgroundColor: "#36393F", color: "white"}}>
                <Row>
                  <Col lg="8">
                    {children}
                  </Col>
                  <Col lg="4" style={{position: "absolute",right: "0px", backgroundColor: "#2F3136", height: "100%"}} >zxcv</Col>
                </Row>
              </div>
            </Row>
          </Col>
        </Row>
      </Container>

  )
}
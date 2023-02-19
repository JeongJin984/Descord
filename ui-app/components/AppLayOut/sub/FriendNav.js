import {Image, Nav} from "react-bootstrap";
import Button from "react-bootstrap/Button";
import {useSelector} from "react-redux";

export default () =>  {

  const { isChattingOn } = useSelector(state => state.userReducer)

  return (
    <Nav variant="pills" defaultActiveKey="/home" style={{marginTop: "5px"}}>
      <Image src={"/friends.png"} style={{height: "9%", marginLeft: "1%", marginRight: "1%"}}/>
      <Nav.Item>
        <Nav.Link eventKey="link-1" style={{color: "white"}}>친구</Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link eventKey="link-2" style={{color: "white"}}>친구 추가</Nav.Link>
      </Nav.Item>\
    </Nav>
  )
}

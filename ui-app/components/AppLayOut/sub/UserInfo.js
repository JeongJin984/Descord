import {Image} from "react-bootstrap";

export default ({userInfo}) => (
    <div style={{width: "50%", float: "left"}}>
        <div style={{width: "32%", float: "left"}}>
            <Image roundedCircle={true} src={userInfo.profileImage}
                   style={{width: "30px", marginTop: "20px"}}/>
        </div>
        <div style={{width: "68%", float: "right", color: "white", marginTop: "15px"}}>
            <div>{userInfo.name}</div>
            <div>{userInfo.code}</div>
        </div>
    </div>
)
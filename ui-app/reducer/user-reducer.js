import produce from "immer";
import {HYDRATE} from "next-redux-wrapper";

const initialState = {
    loginUser: null,
    isLoginSucceed: false,
    onlineUserList: [],

    isChattingOn: false,

    text_chats: [],

    flagSendDatachannel: false,

    connectedToChatUser: null,
    connectionAnswer: null,

    chatRequestModal: false,
    waitingAnswerModal: false,
}

const userReducer = (state = initialState, action) => {
    return produce(state, draft => {
        switch (action.type) {
            case "CLEAR_TEXT_CHAT":
                draft.text_chats = []
                break
            case "CHAT_REQUEST_MODAL":
                draft.chatRequestModal = action.data
                break
            case "CHAT_ANSWER_MODAL":
                draft.waitingAnswerModal = action.data
                break
            case "UPDATE_ONLINE_USER":
                draft.onlineUserList.push({
                    name: action.data,
                    state: "online"
                })
                break
            case "CHATTING_EVENT":
                draft.text_chats.push({ data: action.data, texter: action.texter })
                break
            case "CHATTING_STATE":
                draft.isChattingOn = action.data
                break
            case "INIT_CONNECTION":
                draft.connection = action.data
                break
            case "FLAG_SEND_DATACHANNEL":
                draft.flagSendDatachannel = action.data
                break
            case "LOAD_USER_LIST":
                draft.onlineUserList = action.data
                break
            case "LOGIN_REQUEST":
                draft.loginUser = action.data;
                break
            case "INIT_CONNECTED_CHAT_USER":
                draft.connectedToChatUser = action.user
                break
            case "INIT_CONNECTION_ANSWER":
                draft.connectionAnswer = action.data
                break
            case "LOGIN_SUCCESS":
                draft.isLoginSucceed = true
                draft.onlineUserList.push({
                    name: draft.loginUser,
                    state: "online"
                }, )
                break
            case "LOGIN_FAILURE":
                draft.isLoginSucceed = false
                draft.loginUser = null
                break
            default:
                break;
        }
    })
}

export default userReducer;
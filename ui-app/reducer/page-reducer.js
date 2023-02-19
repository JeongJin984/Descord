import produce from "immer";
import {HYDRATE} from "next-redux-wrapper";

const initialState = {
}

const pageReducer = (state = initialState, action) => {
    return produce(state, draft => {
        switch (action.type) {

            default:
                break;
        }
    })
}

export default pageReducer;
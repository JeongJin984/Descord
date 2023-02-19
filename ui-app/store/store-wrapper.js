import { createWrapper } from 'next-redux-wrapper'

import {configureStore} from "@reduxjs/toolkit";
import pageReducer from "../reducer/page-reducer";
import userReducer from "../reducer/user-reducer";
import {enableMapSet} from "immer";

enableMapSet();

const makeStore = () =>
    configureStore({
        reducer: {
            userReducer,
            pageReducer
        },
        devTools: true,
    });

const wrapper = createWrapper(makeStore, { debug: true })

export default wrapper